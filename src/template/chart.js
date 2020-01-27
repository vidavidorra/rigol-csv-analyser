$.getJSON('{{ dataFile }}', data => {
  const start = new Date();
  Highcharts.stockChart('container', {
    chart: {
      type: 'line',
      events: {
        load: function() {
          if (!window.TestController) {
            this.setTitle(null, {
              text: `Built chart in ${new Date() - start} ms`,
            });
          }
        },
      },
      zoomType: 'x',
      panKey: 'shift',
      height: '40%',
    },
    title: {
      text: '{{ title }}',
    },
    subtitle: {
      text: 'Built chart in ...',
    },
    legend: {
      enabled: true,
    },
    rangeSelector: {
      buttons: [
        {
          type: 'millisecond',
          count: 100,
          text: '100 ns',
        },
        {
          type: 'millisecond',
          count: 1e3,
          text: '1 μs',
        },
        {
          type: 'millisecond',
          count: 10e3,
          text: '10 μs',
        },
        {
          type: 'millisecond',
          count: 100e3,
          text: '100 μs',
        },
        {
          type: 'millisecond',
          count: 1e6,
          text: '1 ms',
        },
        {
          type: 'millisecond',
          count: 10e6,
          text: '10 ms',
        },
        {
          type: 'millisecond',
          count: 100e6,
          text: '100 ms',
        },
        {
          type: 'millisecond',
          count: 1e9,
          text: '1 s',
        },
        {
          type: 'millisecond',
          count: 10e9,
          text: '10 s',
        },
        {
          type: 'millisecond',
          count: 100e9,
          text: '100 s',
        },
        {
          type: 'all',
          text: 'All',
        },
      ],
      buttonTheme: {
        width: 40,
      },
      inputEnabled: false,
    },
    xAxis: {
      type: 'datetime',
      labels: {
        formatter: function() {
          // console.log(
          //   `min: ${this.axis.min.toFixed(0) /
          //     1000} μs, max: ${this.axis.max.toFixed(0) / 1000} μs, range: ${(
          //     this.axis.max - this.axis.min
          //   ).toFixed(0) / 1000} μs`
          // );
          return `${(this.value / 1000).toLocaleString()} ms`;
        },
      },
    },
    yAxis: {
      title: {
        text: 'Voltage [V]',
      },
    },

    tooltip: {
      split: true,
      formatter: function() {
        return [`<b>${(this.x / 1000).toLocaleString()} ms<b>`, `${this.y} V`];
      },
    },
    navigator: {
      height: 100,
      xAxis: {
        labels: {
          formatter: function() {
            return `${(this.value / 1000).toLocaleString()} ms`;
          },
        },
      },
    },
    plotOptions: {
      series: {
        marker: {
          enabledThreshold: 5,
        },
      },
    },
    series: data.series,
  });
});
