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
          this.statistics = csvInstance.Statistics();
          this.statistics.forEach(statistic => {
            console.log('Statistic!!!');
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
      .forEach(channel => {
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
        quantities.count.totalValues.push(statistics.N());
        quantities.sum.totalValues.push(statistics.Sum());
        quantities.min.totalValues.push(statistics.Min());
        quantities.max.totalValues.push(statistics.Max());
        quantities.mean.totalValues.push(statistics.Mean());
        quantities.variance.totalValues.push(statistics.Variance());
        quantities.standardDeviation.totalValues.push(
          statistics.StandardDeviation()
        );
      });

    Object.keys(quantities).forEach(key => {
      const quantity = quantities[key];
      // quantities.forEach(quantity => {
      table.push('<tr>');
      table.push(
        mustache.render(nonNumericTemplate, {
          tag: 'td',
          content: quantity.name,
        })
      );

      quantity.totalValues.forEach(totalValue => {
        table.push(
          mustache.render(numericTemplate, {
            tag: 'td',
            content: totalValue,
          })
        );
      });

      quantity.selectionValues.forEach(selectionValue => {
        table.push(
          mustache.render(numericTemplate, {
            tag: 'td',
            content: selectionValue,
          })
        );
      });
      table.push('</tr>');
    });

    table.push('</tbody>');

    return table.join('\n');

    // <table
    //   class="mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp"
    // >
    //   <thead>
    //     <tr>
    //       <th class="mdl-data-table__cell--non-numeric">Material</th>
    //       <th>Quantity</th>
    //       <th>Unit price</th>
    //     </tr>
    //   </thead>
    //   <tbody>
    //     <tr>
    //       <td class="mdl-data-table__cell--non-numeric">
    //         Acrylic (Transparent)
    //       </td>
    //       <td>25</td>
    //       <td>$2.90</td>
    //     </tr>
    //     <tr>
    //       <td class="mdl-data-table__cell--non-numeric">Plywood (Birch)</td>
    //       <td>50</td>
    //       <td>$1.25</td>
    //     </tr>
    //     <tr>
    //       <td class="mdl-data-table__cell--non-numeric">
    //         Laminate (Gold on Blue)
    //       </td>
    //       <td>10</td>
    //       <td>$2.35</td>
    //     </tr>
    //   </tbody>
    // </table>
  }
}
