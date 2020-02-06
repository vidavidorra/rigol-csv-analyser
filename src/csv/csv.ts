import * as models from '../models/csv';
import { CsvHeader } from './header';
import { CsvInfo } from './info';
import { Data } from './data';

export class Csv {
  private path: string;
  private csv: models.Csv;
  private read: boolean;

  constructor(path: string) {
    this.path = path;
    this.read = false;
  }

  public Csv(): Promise<models.Csv> {
    if (this.read) {
      return Promise.resolve(this.csv);
    }

    return this.Read().then(() => {
      return this.csv;
    });
  }

  public ProcessData(outputFile: string): Promise<void> {
    const data = new Data(this.path, outputFile, this.csv);

    return data.Convert().then(() => {
      return data.Combine();
    });
  }

  private Read(): Promise<void> {
    if (this.read) {
      return Promise.resolve();
    }

    const csvHeader = new CsvHeader(this.path);
    const csvInfo = new CsvInfo(this.path);
    return Promise.all([csvHeader.Header(), csvInfo.Info()]).then(
      ([header, info]) => {
        this.csv = new models.Csv(header, info);
      }
    );
  }
}
