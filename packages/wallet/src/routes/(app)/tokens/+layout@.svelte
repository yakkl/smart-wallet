<script lang="ts">
</script>

<!--visible relative  border-b border-gray-300 inset-x-0 top-0 -->
<!-- bg-[url('/images/imagebar.png')] style="background-image: url('/images/imagebar.png');"> -->
<!-- shadow-lg hover:shadow-xl img-background bg-center -->
<div class="print:hidden bg-base-100  m-2 rounded-xl border border-gray-900 overflow-hidden"> 
  <slot />
</div>

<!-- <style>
.img-background {
  position: relative; 
}

.img-background::before {    
  content: "";
  background-image: url('/images/imagebar.png');
  background-size: cover;
  background-position: center;
  position: absolute;
  height: 225px;
  width: 100%;
  top: 0px;
  left: 0px;
  opacity: 0.3;
}  
</style> -->
