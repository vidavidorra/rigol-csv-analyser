import * as models from '../models/csv';
import CombinedStream from 'combined-stream';
import { Statistics } from '../statistics';
import es from 'event-stream';
import fs from 'fs';
import intoStream from 'into-stream';

interface Row {
  index: number;
  values: number[];
}

export class Data {
  private path: string;
  private outputFile: string;
  private csv: models.Csv;
  private read: boolean;
  private tempFiles: string[] = [];

  constructor(path: string, outputFile: string, csv: models.Csv) {
    this.path = path;
    this.outputFile = outputFile;
    this.csv = csv;
    this.read = false;
  }

  public Convert(): Promise<Statistics[]> {
    return new Promise((resolve, reject) => {
      const statistics = this.ChannelStatistics();
      const readStream = fs.createReadStream(this.path, 'utf8');
      readStream.on('error', (error): void => {
        reject(error);
      });
      readStream.on('end', (): void => {
        resolve(statistics);
      });

      const writeStreams = this.ChannelWriteStreams();
      const outputRows = 1024;
      const outputs = [];
      this.csv
        .Header()
        .Channels()
        .forEach(() => {
          outputs.push('');
        });

      let lineCount = 1;
      readStream.pipe(es.split()).pipe(
        es.map((line, callback) => {
          if (
            lineCount < this.csv.Header().FirstDataLine() ||
            lineCount > this.csv.Info().NumberOfRows()
          ) {
            lineCount++;
            return;
          }

          const row = this.ParseLine(line);

          this.csv
            .Header()
            .Channels()
            .forEach((channel, index) => {
              outputs[
                index
              ] += `        [${row.index}, ${row.values[index]}],\n`;
              let shouldWrite = lineCount % outputRows === 0;
              statistics[index].Push(row.values[index]);

              if (lineCount === this.csv.Info().NumberOfRows()) {
                outputs[index] = outputs[index].slice(0, -2) + '\n';
                shouldWrite = true;
              }

              if (shouldWrite) {
                writeStreams[channel].write(outputs[index]);
                shouldWrite = false;
                outputs[index] = '';
              }
            });

          lineCount++;
          callback();
        })
      );
    });
  }

  public Combine(channelNames: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const combinedStream = CombinedStream.create();
      const numberOfDataRows =
        this.csv.Info().NumberOfRows() - this.csv.Header().FirstDataLine() + 1;
      combinedStream.append(
        intoStream(
          [
            '{',
            `  "increment": ${this.csv.Header().Increment()},`,
            `  "numberOfRows": ${numberOfDataRows},`,
            '  "series": [',
          ].join('\n')
        )
      );

      this.csv
        .Header()
        .Channels()
        .forEach((channel, index, channels) => {
          const prefixes = [
            `    {`,
            `      "name": "${channelNames[index]}",`,
            '      "type": "line",',
            '      "data": [',
          ];
          combinedStream.append(intoStream(`${prefixes.join('\n')}\n`));

          const readStream = fs.createReadStream(
            this.ChannelOutputFile(channel),
            {
              encoding: 'utf8',
            }
          );
          combinedStream.append(readStream);

          const suffixes = ['      ]'];
          if (channels.length - 1 === index) {
            suffixes.push('    }');
          } else {
            suffixes.push('    },');
          }
          combinedStream.append(intoStream(`${suffixes.join('\n')}\n`));
        });
      combinedStream.append(intoStream('  ]\n}\n'));

      const writeStream = fs
        .createWriteStream(this.outputFile, {
          encoding: 'utf8',
        })
        .on('error', (error): void => {
          reject(error);
        });

      writeStream.on('close', () => {
        this.RemoveTempFiles();
        resolve();
      });

      combinedStream.pipe(writeStream);
    });
  }

  private ParseLine(line: string): Row {
    const elements = line.replace(/,$/, '').split(',');

    const row: Row = {
      index: Number(elements[0]),
      values: [],
    };
    elements.slice(1).forEach(element => {
      row.values.push(Number(element));
    });

    return row;
  }

  private ChannelWriteStreams(): {} {
    const writeStreams = {};
    this.csv
      .Header()
      .Channels()
      .forEach(channel => {
        const writeStream = fs.createWriteStream(
          this.ChannelOutputFile(channel),
          {
            encoding: 'utf8',
          }
        );

        writeStreams[channel] = writeStream;
        this.tempFiles.push(this.ChannelOutputFile(channel));
      });

    return writeStreams;
  }

  private ChannelStatistics(): Statistics[] {
    const statistics = [];
    this.csv
      .Header()
      .Channels()
      .forEach(() => {
        statistics.push(new Statistics());
      });

    return statistics;
  }

  private ChannelOutputFile(channel: string): string {
    return `${this.outputFile}-${channel}.txt`;
  }

  private RemoveTempFiles(): void {
    this.tempFiles.forEach(file => {
      fs.unlinkSync(file);
    });
  }
}
