<script lang="ts">
  export let text = "";

  function formatText(inputText: string) {
    return inputText
      .split("\r\n")
      .map((line) => `<p>${line}</p>`)
      .join("");
  }

  $: formattedText = formatText(text);
</script>

<div class="formatted-text">{formattedText}</div>
