import CombinedStream from 'combined-stream';
import { Header } from './header';
import fs from 'fs';
import parse from 'csv-parse';
import toReadableStream from 'to-readable-stream';
import transform from 'stream-transform';

export class CsvData {
  private csvFile: string;
  private header: Header;
  private outputFile: string;
  private tempFiles: string[] = [];

  public constructor(csvFile: string, header: Header, outputFile: string) {
    this.csvFile = csvFile;
    this.header = header;
    this.outputFile = outputFile;
  }

  public RemoveTempFiles(): void {
    this.tempFiles.forEach(file => {
      fs.unlinkSync(file);
    });
  }

  public Parse(): Promise<void> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(this.csvFile, {
        encoding: 'utf8',
      });
      readStream.on('error', (error): void => {
        reject(error);
      });

      const writeStreams = {};
      this.header.Channels().forEach(channel => {
        this.tempFiles.push(this.ChannelOutputFile(channel));
        const writeStream = fs
          .createWriteStream(this.ChannelOutputFile(channel), {
            encoding: 'utf8',
          })
          .on('error', (error): void => {
            reject(error);
          });

        writeStreams[channel] = writeStream;
      });

      const parser = parse({
        relax_column_count: true, // eslint-disable-line @typescript-eslint/camelcase
        columns: this.header.Columns(),
        from_line: this.header.FirstDataLine(), // eslint-disable-line @typescript-eslint/camelcase
      });

      parser.on('error', error => {
        reject(error);
      });

      const transformer = transform(data => {
        return JSON.parse(JSON.stringify(data).toLowerCase());
      });

      transformer.on('readable', () => {
        let row;
        while ((row = transformer.read())) {
          this.header.Channels().forEach(channel => {
            let output = '        ';
            output += JSON.stringify([Number(row.index), Number(row[channel])]);
            if (!(transformer.readableLength === 0 && readStream.destroyed)) {
              output += ',';
            }
            output += '\n';

            writeStreams[channel].write(output);
            resolve();
          });
        }
      });
      transformer.on('error', (error): void => {
        reject(error);
      });

      readStream.pipe(parser).pipe(transformer);
    });
  }

  public Combine(): Promise<void> {
    return new Promise((resolve, reject) => {
      const combinedStream = CombinedStream.create();
      combinedStream.append(toReadableStream('{\n  "series": [\n'));

      this.header.Channels().forEach((channel, index, channels) => {
        const prefixes = [
          `    {`,
          `      "name": "${channel}",`,
          '      "type": "line",',
          '      "data": [',
        ];
        combinedStream.append(toReadableStream(`${prefixes.join('\n')}\n`));

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
        combinedStream.append(toReadableStream(`${suffixes.join('\n')}\n`));
      });
      combinedStream.append(toReadableStream('  ]\n}\n'));

      const writeStream = fs
        .createWriteStream(this.outputFile, {
          encoding: 'utf8',
        })
        .on('error', (error): void => {
          reject(error);
        });

      writeStream.on('close', () => {
        combinedStream.destroy();
        resolve();
      });

      combinedStream.pipe(writeStream);
    });
  }

  private ChannelOutputFile(channel: string): string {
    return `${this.outputFile}-${channel}.txt`;
  }
}
