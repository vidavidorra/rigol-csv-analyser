import * as models from '../models/csv';
import { CsvHeader } from './header';
import { CsvInfo } from './info';

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
