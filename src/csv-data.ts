import CombinedStream from 'combined-stream';
import { Header } from './header';
// import csv from 'csvtojson';
import * as csv from 'fast-csv';
import fs, { read } from 'fs';
import parse from 'csv-parse';
import readline from 'readline';
import toReadableStream from 'to-readable-stream';
import transform from 'stream-transform';
import es from 'event-stream';

export class CsvData {
  private csvFile: string;
  private header: Header;
  private outputFile: string;
  private tempFiles: string[] = [];
  private chartData = { series: [] };

  public constructor(csvFile: string, header: Header, outputFile: string) {
    this.csvFile = csvFile;
    this.header = header;
    this.outputFile = outputFile;
    console.log(this.header.Columns());
  }

  public RemoveTempFiles(): void {
    this.tempFiles.forEach(file => {
      fs.unlinkSync(file);
    });
  }

  public async Parse(): Promise<void> {
    const rows = await this.NumberOfRows();
    console.log(`File contains ${rows} rows (lines)`);

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(this.csvFile, 'utf8');
      readStream.on('end', (): void => {
        // resolve(count);
      });
      readStream.on('error', (error): void => {
        reject(error);
      });

      //

      //

      const writeStream = fs.createWriteStream(`${this.outputFile}.txt`, {
        encoding: 'utf8',
      });

      let count = -1;
      readStream.pipe(es.split()).pipe(
        es.map((line, callback) => {
          count++;
          if (count < this.header.FirstDataLine()) {
            return;
          }
          if (count >= rows) {
            return;
          }

          const obj = {};
          line
            .replace(/,$/, '')
            .split(',')
            .forEach((e, index) => {
              obj[this.header.Columns()[index]] = e;
            });
          this.header.Channels().forEach((channel, index) => {
            writeStream.write(
              JSON.stringify([Number(obj['i']), Number(obj[channel])]) + '\n'
            );
          });

          callback();
        })
      );

      // let line = 0;
      // // const chartData = { series: [] };
      // this.header.Channels().forEach(channel => {
      //   this.chartData.series.push({
      //     name: channel,
      //     type: 'line',
      //     data: [],
      //   });
      // });
      // console.log(this.chartData);
      // const lineReader = readline
      //   .createInterface(readStream)
      //   .on('line', l => {
      //     line += 1;
      //     if (line < 3) {
      //       return;
      //     }
      //     if (line > rows) {
      //       readStream.destroy();
      //       lineReader.close();
      //       return;
      //     }
      //     const obj = {};
      //     l.replace(/,$/, '')
      //       .split(',')
      //       .forEach((e, index) => {
      //         obj[this.header.Columns()[index]] = e;
      //       });
      //     // console.log(obj);
      //     this.header.Channels().forEach((channel, index) => {
      //       // console.log(line, [Number(obj['i']), Number(obj[channel])]);
      //       writeStream.write(
      //         JSON.stringify([Number(obj['i']), Number(obj[channel])]) + '\n'
      //       );
      //     });
      //   })
      //   .on('close', () => {
      //     resolve();
      //     console.log('read all lines');
      //     // JSON.stringify(this.chartData);
      //     console.log(process.memoryUsage());
      //   });
    });
  }

  // private ParseLine(line: string): void {
  //   const obj = {};
  //   l.replace(/,$/, '')
  //     .split(',')
  //     .forEach((e, index) => {
  //       obj[this.header.Columns()[index]] = e;
  //     });
  // }

  public Combines(): void {
    this.header.Channels().forEach((channel, index, channels) => {
      const prefixes = [
        `    {`,
        `      "name": "${channel}",`,
        '      "type": "line",',
        '      "data": [',
      ];
      fs.writeFileSync(this.outputFile, `${prefixes.join('\n')}\n`, 'utf8');

      const data = fs.readFileSync(this.ChannelOutputFile(channel), 'utf8');
      fs.appendFileSync(`${this.outputFile}.txt`, data, 'utf8');

      // const suffixes = ['      ]'];
      // if (channels.length - 1 === index) {
      //   suffixes.push('    }');
      // } else {
      //   suffixes.push('    },');
      // }
      // combinedStream.append(toReadableStream(`${suffixes.join('\n')}\n`));
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
        console.log(process.memoryUsage());
        resolve();
      });

      combinedStream.pipe(writeStream);
    });
  }

  private ChannelOutputFile(channel: string): string {
    return `${this.outputFile}-${channel}.txt`;
  }

  private NumberOfRows(): Promise<number> {
    return new Promise((resolve, reject) => {
      let count = 0;
      const readStream = fs.createReadStream(this.csvFile, 'utf8');
      readStream.on('end', (): void => {
        resolve(count);
      });
      readStream.on('error', (error): void => {
        reject(error);
      });

      readStream.pipe(es.split()).pipe(
        es.map((line, callback) => {
          if (line.length > 0) {
            count++;
          }

          callback();
        })
      );
    });
  }
}
