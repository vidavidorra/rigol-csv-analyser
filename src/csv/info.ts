import * as models from '../models/csv';
import es from 'event-stream';
import fs from 'fs';

export class CsvInfo {
  private path: string;
  private info: models.Info;
  private read: boolean;

  constructor(path: string) {
    this.path = path;
    this.read = false;
  }

  public Info(): Promise<models.Info> {
    if (this.read) {
      return Promise.resolve(this.info);
    }

    return this.Read().then(() => {
      return this.info;
    });
  }

  private Read(): Promise<void> {
    if (this.read) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let numberOfRows = 0;

      const readStream = fs.createReadStream(this.path, 'utf8');
      readStream.on('end', (): void => {
        this.read = true;
        resolve();
      });
      readStream.on('error', (error): void => {
        reject(error);
      });
      readStream.on('end', (): void => {
        this.info = new models.Info(numberOfRows);
        resolve();
      });

      readStream.pipe(es.split()).pipe(
        es.map((line, callback) => {
          if (line.length > 0) {
            numberOfRows++;
          }

          callback();
        })
      );
    });
  }
}
