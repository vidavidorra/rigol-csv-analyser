import { Header } from './header';
import { Info } from './info';

export class Csv {
  private header: Header;
  private info: Info;

  constructor(header: Header, info: Info) {
    this.header = header;
    this.info = info;
  }

  public Header(): Header {
    return this.header;
  }

  public Info(): Info {
    return this.info;
  }
}
