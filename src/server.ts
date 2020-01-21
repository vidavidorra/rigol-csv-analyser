import express from 'express';
import open from 'open';

export class Server {
  private port: number;
  private directory: string;

  public constructor(port: number, directory: string) {
    this.port = port;
    this.directory = directory;
  }

  public Start(): void {
    const app = express();
    app.use(express.static(this.directory));

    app.listen(this.port, () => {
      console.log(`Server started: ${this.Url()}`);
    });
  }

  public OpenBrowser(): void {
    open(this.Url());
  }

  public Url(): string {
    return `http://localhost:${this.port}`;
  }
}
