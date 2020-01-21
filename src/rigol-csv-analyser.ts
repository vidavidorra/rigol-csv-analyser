import { Server } from './server';
import fs from 'fs';
import mustache from 'mustache';
import path from 'path';

export class RigolCsvAnalyser {
  private serveDirectory = 'public';
  private templateDirectory = 'src/template';
  private serveFiles = {
    html: 'index.html',
    chart: 'chart.js',
    data: 'data.json',
  };
  private port: number;

  public constructor(port: number) {
    this.port = port;
  }

  public Analyse(): void {
    /**
     * - Parse CSV
     * - Generate serveFiles.data
     */
    this.GenerateChart();
  }

  public Serve(): void {
    const server = new Server(this.port, this.serveDirectory);
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
      title: 'Oscilloscope measurements',
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

const rca = new RigolCsvAnalyser(8081);
rca.Analyse();
rca.Serve();
