import { Options } from './options';
import { Server } from './server';
import fs from 'fs';
import mustache from 'mustache';
import parse from 'csv-parse';
import path from 'path';
import transform from 'stream-transform';

interface Header {
  increment: number;
  channels: string[];
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
  }

  public async Analyse(): Promise<void> {
    this.header = await this.ParseHeader();
    console.log(`Increment: ${this.header.increment * 1000} ms`);
    console.log(`Channels: '${this.header.channels.join("', '")}'`);

    // await this.ParseData();

    this.GenerateChart();
  }

  private ParseHeader(): Promise<Header> {
    /**
     * CSV header from a Rigol DS1054Z.
     *
     * ```
     * X,CH1,CH2,Start,Increment,
     * Sequence,Volt,Volt,-5.999998e-02,2.000000e-05
     * ```
     */
    return new Promise((resolve, reject) => {
      const header: Header = {
        increment: 0,
        channels: [],
      };

      /*
       * The header is expected to be less than 200 bytes. The following header
       * has 71 bytes, even with 8 channels it would still be ... bytes.
       *
       * ```
       * X,CH1,CH2,Start,Increment,
       * Sequence,Volt,Volt,-5.999998e-02,2.000000e-05
       * ```
       */
      const headerBytes = 200;
      const readStream = fs.createReadStream(this.options.csvFile, {
        encoding: 'utf8',
        end: headerBytes,
      });

      readStream.on('close', (): void => {
        reject('CSV header could not be parsed.');
      });
      readStream.on('error', (error): void => {
        reject(error);
      });

      const parser = parse({
        relax_column_count: true, // eslint-disable-line @typescript-eslint/camelcase
        columns: true,
      });

      parser.on('data', (chunk): void => {
        const row = JSON.parse(JSON.stringify(chunk).toLowerCase());

        if (!header.increment && 'increment' in row) {
          const keys = Object.keys(row);
          header.channels = keys.filter(key => key.startsWith('ch'));
          header.increment = row.increment;

          readStream.destroy();
          parser.destroy();
          resolve(header);
        }
      });
      parser.on('error', error => {
        reject(error);
      });

      readStream.pipe(parser);
    });
  }

  public Serve(): void {
    const server = new Server(this.options.port, this.serveDirectory);
    server.Start();
    server.OpenBrowser();
  }

  private GenerateChart(): void {
    fs.rmdirSync(this.serveDirectory, { recursive: true });
    fs.mkdirSync(this.serveDirectory);
    fs.copyFileSync(
      path.join(this.templateDirectory, this.serveFiles.data),
      path.join(this.serveDirectory, this.serveFiles.data)
    );

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
