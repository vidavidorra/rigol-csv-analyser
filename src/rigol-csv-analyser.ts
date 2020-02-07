import * as csv from './csv';
import * as models from './models/csv';
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

  private csv: models.Csv;

  public constructor(options: Options) {
    this.options = options;
    this.CreateServeDirectory();
  }

  public Analyse(): Promise<void> {
    return new Promise(resolve => {
      const csvInstance = new csv.Csv(this.options.csvFile);
      csvInstance
        .Csv()
        .then(csvData => {
          this.csv = csvData;
        })
        .then(() => {
          return csvInstance.ProcessData(
            path.join(this.serveDirectory, this.serveFiles.data),
            this.options.channelNames,
            this.options.channelUnits
          );
        })
        .then(() => {
          this.GenerateChart();
          resolve();
        });
    });
  }

  public Serve(): void {
    const server = new Server(this.options.port, this.serveDirectory);
    server.Start();
    server.OpenBrowser();

    console.log('Press ctrl+c to close');
  }

  private CreateServeDirectory(): void {
    fs.rmdirSync(this.serveDirectory, { recursive: true });
    fs.mkdirSync(this.serveDirectory);
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
