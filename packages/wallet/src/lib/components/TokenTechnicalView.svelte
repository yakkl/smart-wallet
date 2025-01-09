<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { symbol = 'CRYPTO:ETHUSD' } = $props();
  let widgetContainer: HTMLDivElement | null = null;
  const URL = import.meta.env.VITE_TRADING_VIEW_LINK;

  const initializeWidget = () => {
    if (!widgetContainer) return;

    // Clear any existing widget
    widgetContainer.innerHTML = '';

    // Add the widget container for the new TradingView script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = '../../js/embed-widget-technical-analysis.js';
    script.innerHTML = JSON.stringify({
      interval: '1m',
      width: '392',
      isTransparent: false,
      height: '950',
      symbol, // Dynamically set the symbol
      showIntervalTabs: true,
      displayMode: 'multiple',
      locale: 'en',
      colorTheme: 'light',
    });

    widgetContainer.appendChild(script);
  };

  // Reactively reinitialize the widget when `symbol` changes
  // $effect(() => {
  //   initializeWidget();
  // });

  onMount(() => {
    initializeWidget();
  });

  onDestroy(() => {
    if (widgetContainer) {
      widgetContainer.innerHTML = '';
    }
  });
</script>

<section id="technical-analysis">
  <div class="tradingview-widget-container">
    <div bind:this={widgetContainer} class="tradingview-widget-container__widget"></div>
    <div class="tradingview-widget-copyright">
      <a
        href={URL}
        rel="noopener nofollow"
        target="_blank"
      >
        <span class="blue-text">Track all markets on TradingView</span>
      </a>
    </div>
  </div>
</section>

<style>
  .tradingview-widget-container {
    width: 100%;
    height: 100%;
  }
</style>

