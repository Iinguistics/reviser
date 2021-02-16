import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';


// instead of using local storage which does not have that much space, using localForage
// this gets stored under storage - IndexedDB..if the user does not have a browser that supporst this it defaults to local storage..once local storage is full it will automatically remove items cached in there to make room
const fileCache = localForage.createInstance({
    name: 'filecache'
   });

export const fetchPlugin = (input:string)=>{
   return{
       name: 'fetch-plugin',
       setup(build: esbuild.PluginBuild){
       build.onLoad({ filter: /(^index\.js$)/ }, ()=>{
        return {
          loader: 'jsx',
          contents: input,
        };
       });

      build.onLoad({ filter: /.*/ }, async (args: any) => {

        // Check to see if we have already fetched this file, & if is is in the cache
        // Specify what getItem will return, that is what cachedResult will return, without esbuild.OnLoadResult the type will be unkown/throws err
        // onLoad method must return the specs of the onLoadResult ts interface..refer to main.d.ts file
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        // If it is, return in immediately
        if(cachedResult){
          return cachedResult;
        }
      });

       build.onLoad({ filter:  /.css$/ }, async(args: any)=>{
        // Check to see if we have already fetched this file, & if is is in the cache
        // Specify what getItem will return, that is what cachedResult will return, without esbuild.OnLoadResult the type will be unkown/throws err
        // onLoad method must return the specs of the onLoadResult ts interface..refer to main.d.ts file
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
        // If it is, return in immediately
        if(cachedResult){
          return cachedResult;
        }
    
        const { data, request } = await axios.get(args.path);


        // remove all quotes & different string so style.innerText singlequotes does not get esacaped
        const escaped = data
        .replace(/\n/g, '')
        .replace(/"/g, '"\\"')
        .replace(/'/g, "\\'");

        const contents = 
        `const style = document.createElement('style');
         style.innerText = '${escaped}';
         document.head.appendChild(style);
        `;
          
        const result:esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: contents,
          resolveDir: new URL('./', request.responseURL).pathname
        };
    
        // store response in cache
        await fileCache.setItem(args.path, result);
        return result;
       });

       build.onLoad({ filter: /.*/ }, async (args: any) => {
    
        const { data, request } = await axios.get(args.path);

        const result:esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname
        };
    
        // store response in cache
        await fileCache.setItem(args.path, result);
        return result;
      });
     }
   }
  }
  

