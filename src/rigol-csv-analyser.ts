import { Options } from './options';
import { Server } from './server';
import fs from 'fs';
import mustache from 'mustache';
import parse from 'csv-parse/lib/sync';
import path from 'path';

export class RigolCsvAnalyser {
  private serveDirectory = 'public';
  private templateDirectory = 'src/template';
  private serveFiles = {
    html: 'index.html',
    chart: 'chart.js',
    data: 'data.json',
  };
  private options: Options;

  private header = {
    increment: 0,
    channels: [],
  };

  public constructor(options: Options) {
    this.options = options;
  }

  public Analyse(): void {
    this.ParseHeader();
    /**
     * - Generate serveFiles.data
     */
    this.GenerateChart();
  }

  /**
   * CSV header from a Rigol DS1054Z.
   * X,CH1,CH2,Start,Increment,
   * Sequence,Volt,Volt,-5.999998e-02,2.000000e-05
   */
  private ParseHeader(): void {
    try {
      const data = Buffer.alloc(200);
      const fd = fs.openSync(this.options.csvFile, 'r');
      fs.readSync(fd, data, 0, data.length, 0);
      fs.closeSync(fd);

      const lines = data
        .toString()
        .split(/\r|\n|\r\n/)
        .slice(0, 2)
        .map((line: string): string => {
          return line.replace(/,$/, '');
        });

      console.log(lines);

      const records = parse(lines.join('\n'), {
        columns: false,
        from_line: 1, // eslint-disable-line @typescript-eslint/camelcase
      });

      const incrementIndex = records[0].findIndex(
        item => 'increment' === item.toLowerCase()
      );
      this.header.increment = Number(records[1][incrementIndex]);
      this.header.channels = records[0].filter(item => item.startsWith('CH'));

      console.log(`Channels: '${this.header.channels.join("', '")}'`);
      console.log(`Increment: ${this.header.increment} s`);
    } catch (error) {
      console.log('Error parsing the header of the file');
      console.log(error);
      process.exit(1);
    }
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
