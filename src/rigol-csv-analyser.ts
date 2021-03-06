import * as csv from './csv';
import * as models from './models/csv';
import { Options } from './options';
import { Server } from './server';
import { Statistics } from './statistics';
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
  private statistics: Statistics[];

  private csv: models.Csv;

  public constructor(options: Options) {
    this.options = options;
    this.CreateServeDirectory();
  }

  public Analyse(): Promise<void> {
    return new Promise((resolve) => {
      const csvInstance = new csv.Csv(this.options.csvFile);
      csvInstance
        .Csv()
        .then((csvData) => {
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
          this.statistics = csvInstance.Statistics();
          this.statistics.forEach((statistic) => {
            statistic.Print();
          });
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
      tableContent: this.GenerateTable(),
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

  private GenerateTable(): string {
    const channelHeaderTemplate = `<th class="mdl-data-table__cell--non-numeric">{{ content }}</th>`;
    const nonNumericTemplate = `<{{ tag }} class="mdl-data-table__cell--non-numeric">{{ content }}</{{ tag }}>`;
    const numericTemplate = `<{{ tag }}>{{ content }}</{{ tag }}>`;
    const numericIdTemplate = `<{{ tag }} id="{{ id }}">{{ content }}</{{ tag }}>`;
    const table = [
      '<thead>',
      '<tr>',
      mustache.render(channelHeaderTemplate, {
        tag: 'th',
        content: 'Quantity',
      }),
    ];

    this.csv
      .Header()
      .Channels()
      .forEach((channel) => {
        table.push(
          mustache.render(nonNumericTemplate, {
            tag: 'th',
            content: `${channel} total`,
          })
        );
        table.push(
          mustache.render(nonNumericTemplate, {
            tag: 'th',
            content: `${channel} selection`,
          })
        );
      });

    table.push('</tr>');
    table.push('</thead>');

    // Body
    table.push('<tbody>');

    const quantities = {
      count: { name: 'Count', totalValues: [], selectionValues: [] },
      duration: { name: 'Duration [s]', totalValues: [], selectionValues: [] },
      sum: { name: 'Sum', totalValues: [], selectionValues: [] },
      min: { name: 'Min', totalValues: [], selectionValues: [] },
      max: { name: 'Max', totalValues: [], selectionValues: [] },
      mean: { name: 'Mean', totalValues: [], selectionValues: [] },
      variance: {
        name: 'Variance',
        totalValues: [],
        selectionValues: [],
      },
      standardDeviation: {
        name: 'Standard deviation',
        totalValues: [],
        selectionValues: [],
      },
    };

    this.csv
      .Header()
      .Channels()
      .forEach((channel, index) => {
        console.log(channel, index);
        const statistics = this.statistics[index];
        quantities.count.totalValues.push(
          this.DigitToString(statistics.N(), 0)
        );
        quantities.duration.totalValues.push(
          this.DigitToString(statistics.N() * this.csv.Header().Increment(), 6)
        );
        quantities.sum.totalValues.push(
          this.DigitToString(statistics.Sum(), 6)
        );
        quantities.min.totalValues.push(
          this.DigitToString(statistics.Min(), 6)
        );
        quantities.max.totalValues.push(
          this.DigitToString(statistics.Max(), 6)
        );
        quantities.mean.totalValues.push(
          this.DigitToString(statistics.Mean(), 6)
        );
        quantities.variance.totalValues.push(
          this.DigitToString(statistics.Variance(), 6)
        );
        quantities.standardDeviation.totalValues.push(
          this.DigitToString(statistics.StandardDeviation(), 6)
        );

        quantities.count.selectionValues.push(`${channel}Count`);
        quantities.duration.selectionValues.push(`${channel}Duration`);
        quantities.sum.selectionValues.push(`${channel}Sum`);
        quantities.min.selectionValues.push(`${channel}Min`);
        quantities.max.selectionValues.push(`${channel}Max`);
        quantities.mean.selectionValues.push(`${channel}Mean`);
        quantities.variance.selectionValues.push(`${channel}Variance`);
        quantities.standardDeviation.selectionValues.push(
          `${channel}StandardDeviation`
        );
      });

    Object.keys(quantities).forEach((key) => {
      const quantity = quantities[key];
      table.push('<tr>');
      table.push(
        mustache.render(nonNumericTemplate, {
          tag: 'td',
          content: quantity.name,
        })
      );

      this.csv
        .Header()
        .Channels()
        .forEach((channel, index) => {
          table.push(
            mustache.render(numericTemplate, {
              tag: 'td',
              content: quantity.totalValues[index],
            })
          );
          table.push(
            mustache.render(numericIdTemplate, {
              tag: 'td',
              id: quantity.selectionValues[index],
              contend: 0,
            })
          );
        });

      table.push('</tr>');
    });

    table.push('</tbody>');

    return table.join('\n');
  }

  private DigitToString(value: number, digits: number): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
}
