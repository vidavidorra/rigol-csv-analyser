export class Statistics {
  private n = 0;
  private min: number;
  private max: number;
  private mean: number;
  // Sum of squared difference from the mean.
  private s = 0;

  N(): number {
    return this.n;
  }

  Min(): number {
    return this.min;
  }

  Max(): number {
    return this.max;
  }

  Sum(): number {
    return this.Mean() * this.n;
  }

  Mean(): number {
    return this.mean;
  }

  Variance(): number {
    if (this.n <= 1) {
      return 0;
    }

    return this.s / this.n;
  }

  StandardDeviation(): number {
    return Math.sqrt(this.Variance());
  }

  Print(): void {
    console.log(`Count: ${this.N()}
Sum  : ${this.Sum()}
Min  : ${this.Min()}
Max  : ${this.Max()}
Mean : ${this.Mean()}
Var  : ${this.Variance()}
Stdev: ${this.StandardDeviation()}`);
  }

  public Push(x: number): void {
    this.n++;

    /**
     * The algorithms for the mean and sum of squared difference from the mean
     * are based on an algorithm from Donald E. Knuth - The Art of Computer
     * Programming volume 2, 3rd edition §4.2.2, equation 15 and 16
     * respectively.
     */
    if (this.n === 1) {
      this.mean = x;
      this.min = x;
      this.max = x;
    } else {
      const oldMean = this.mean;
      this.mean += (x - oldMean) / this.n;
      this.s += (x - oldMean) * (x - this.mean);

      if (x < this.min) {
        this.min = x;
      } else if (x > this.max) {
        this.max = x;
      }
    }
  }
}
