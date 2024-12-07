<script lang="ts">
  interface Props {
    text?: string;
  }

  let { text = "" }: Props = $props();

  function formatText(inputText: string) {
    return inputText
      .split("\r\n")
      .map((line) => `<p>${line}</p>`)
      .join("");
  }

  let formattedText = $derived(formatText(text));
</script>

<div class="formatted-text">{formattedText}</div>
