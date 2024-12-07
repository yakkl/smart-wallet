<script lang="ts">
  import {browser as browserSvelte} from '$app/environment';
  import { page } from '$app/stores';
  // import { handleOpenInTab } from '$lib/utilities/utilities';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
    let browser_ext; 
  if (browserSvelte) browser_ext = getBrowserExt();


  let flaggedSite: string = $state("https://yakkl.com");  // Default
  let yid:string = '';

  if (browserSvelte) {
    try {
      flaggedSite = $page.url.searchParams.get('flaggedSite') as string;
      if (!flaggedSite) throw "No flaggedSite parameter";
      yid = $page.url.searchParams.get('yid') as string;
      if (flaggedSite.includes('?') || flaggedSite.includes('&')) {
        flaggedSite += '&yid=' + yid;
      } else {
        flaggedSite += '?yid=' + yid;
      }
    } catch (e) {
      console.log(e);
      flaggedSite = "https://yakkl.com";  // Default
    }
  }


  // function handleSafety(e) {
  //   handleOpenInTab('https://yakkl.com?utm_source=yakkl&utm_medium=warning');
  // }

</script>

<div class="bg-red-800 text-white h-screen">

  <div class="w-full">
    <div class="w-[33%] ml-[33%] pt-[8%]">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-20 h-20 animate-pulse">
        <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
      </svg>
      
      <h1 class="font-bold text-4xl mb-4">WARNING: Potentially Deceptive Site</h1>

      <p class="mb-4 text-xl">YAKKL® flagged the site you're trying to visit as 'potentially deceptive'. Attackers may trick you into doing something dangerous. <a href="https://cryptoscamdb.org/search" target="_blank" rel="noreferrer" class="underline uppercase">Learn more...</a></p>
      
      <p class="font-bold text-xl">Potential threats at [{flaggedSite}] include:</p>
      <ul class="list-disc ml-10 text-xl">
        <li>Fake versions of YAKKL®</li>
        <li>Secret Recovery Phrase or password theft</li>
        <li>Malicious transactions resulting in stolen assets</li>
      </ul>

      <p class="mt-4 text-xl">Advisory provided by Ethereum Phishing Detector and PhishFort.
        <br/><br/>
        If we're flagging a legitimate website, please report a detection problem.
        <br/>
        If you understand the risks and still want to proceed, you can <a href="{flaggedSite}" class="underline">click here to continue to the site.</a>
      </p>
    </div>
    <a href="https://yakkl.com?utm_source=yakkl&utm_medium=warning" class="btn btn-primary rounded-xl ml-[33%] mt-4">Back to your safe place</a>
  </div>
</div>
