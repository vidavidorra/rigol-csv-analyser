import { CsvData } from './csv-data';
import { CsvHeader } from './csv-header';
import { Header } from './header';
import { Options } from './options';
import { Server } from './server';
import fs from 'fs';
import mustache from 'mustache';
import path from 'path';

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

    await this.ProcessData();

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

  public Serve(): void {
    const server = new Server(this.options.port, this.serveDirectory);
    server.Start();
    server.OpenBrowser();
  }

  private ProcessData(): Promise<void> {
    const outputFile = path.join(this.serveDirectory, this.serveFiles.data);
    const csvData = new CsvData(this.options.csvFile, this.header, outputFile);

    return csvData
      .Parse()
      .then(() => {
        return csvData.Combine();
      })
      .then(() => {
        csvData.RemoveTempFiles();
      });
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
