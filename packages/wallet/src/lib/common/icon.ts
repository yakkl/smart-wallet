// Gets the icon from the dApp's favicon
export const getIcon = () => {
  const faviconElements: NodeListOf < HTMLLinkElement > = window.document.querySelectorAll( "link[rel*='icon']" )
  const largestFavicon = [ ...faviconElements ].sort( ( el ) =>
    parseInt( el.sizes.toString().split( "x" )[ 0 ], 10 )
  )[ 0 ]
  return largestFavicon?.href;
}
