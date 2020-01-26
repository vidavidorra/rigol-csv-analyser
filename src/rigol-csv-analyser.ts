import CombinedStream from 'combined-stream';
import { CsvHeader } from './csv-header';
import { Header } from './header';
import { Options } from './options';
import { Server } from './server';
import fs from 'fs';
import mustache from 'mustache';
import parse from 'csv-parse';
import path from 'path';
import toReadableStream from 'to-readable-stream';
import transform from 'stream-transform';

interface Row {
  index: number;
  value: number;
}

export class RigolCsvAnalyser {
  private serveDirectory = 'public';
  private templateDirectory = 'src/template';
  private serveFiles = {
    html: 'index.html',
    chart: 'chart.js',
    data: 'data.json',
  };
  private options: Options;
  private header: Header;

  public constructor(options: Options) {
    this.options = options;
    this.CreateServeDirectory();
  }

  public async Analyse(): Promise<void> {
    this.header = await this.ReadHeader();

    console.log(`Increment: ${this.header.Increment() * 1000} ms`);
    console.log(`Channels: '${this.header.Channels().join("', '")}'`);

    await this.ParseData();
    await this.Combine();

    this.GenerateChart();
  }

  private CreateServeDirectory(): void {
    fs.rmdirSync(this.serveDirectory, { recursive: true });
    fs.mkdirSync(this.serveDirectory);
  }

  private ReadHeader(): Promise<Header> {
    const csvHeader = new CsvHeader(this.options.csvFile);
    return csvHeader.Read();
  }

  private Combine(): Promise<void> {
    return new Promise((resolve, reject) => {
      const combinedStream = CombinedStream.create();
      combinedStream.append(toReadableStream('[\n'));

      this.header.Channels().forEach((channel, index, channels) => {
        const prefixes = [
          `  {`,
          `    "name": "${channel}",`,
          '    "type": "line",',
          '    "data": [',
        ];
        combinedStream.append(toReadableStream(`${prefixes.join('\n')}\n`));

        const ouputFile = path.join(
          this.serveDirectory,
          `${this.serveFiles.data}-${channel}.txt`
        );
        const readStream = fs.createReadStream(ouputFile, {
          encoding: 'utf8',
        });
        combinedStream.append(readStream);

        const suffixes = ['    ]'];
        if (channels.length - 1 === index) {
          suffixes.push('  }');
        } else {
          suffixes.push('  },');
        }
        combinedStream.append(toReadableStream(`${suffixes.join('\n')}\n`));
      });
      combinedStream.append(toReadableStream(']\n'));

      const serveDataFile = path.join(
        this.serveDirectory,
        this.serveFiles.data
      );
      const writeStream = fs
        .createWriteStream(serveDataFile, {
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

  private ParseData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(this.options.csvFile, {
        encoding: 'utf8',
      });
      readStream.on('error', (error): void => {
        reject(error);
      });

      const writeStreams = {};
      this.header.Channels().forEach(channel => {
        const ouputFile = path.join(
          this.serveDirectory,
          `${this.serveFiles.data}-${channel}.txt`
        );
        const writeStream = fs
          .createWriteStream(ouputFile, {
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
            let output = JSON.stringify([
              Number(row.index),
              Number(row[channel]),
            ]);
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

  public Serve(): void {
    const server = new Server(this.options.port, this.serveDirectory);
    server.Start();
    server.OpenBrowser();
  }

  private GenerateChart(): void {
    const view = {
      title: this.options.title,
      chartScript: this.serveFiles.chart,
      dataFile: this.serveFiles.data,
    };

    [this.serveFiles.html, this.serveFiles.chart].forEach(
      (file: string): void => {
        const htmlContent = fs.readFileSync(
          path.join(this.templateDirectory, file),
          'utf8'
        );

        fs.writeFileSync(
          path.join(this.serveDirectory, file),
          mustache.render(htmlContent, view)
        );
      }
    );
  }
}
