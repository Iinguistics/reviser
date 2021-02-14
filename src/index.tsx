import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin'

const App = ()=>{
    // acts as a component var instead of doing a piece of state, we can hold values in this useRef, ref.current
    // ref.current will hold the esbuild startService object which contains build,serve,stop & transform methods
    const ref = useRef<any>();

    const [input, setInput] = useState("");
    const [code, setCode] = useState("");


    const startService = async()=>{
        ref.current = await esbuild.startService({
            worker: true,
            wasmURL: '/esbuild.wasm'
        });
    };

    useEffect(()=>{
        startService();
        }, []);

    const submitHandler = async()=>{
        if(!ref.current){
            return;
        }
       const result = await ref.current.build({
            entryPoints: ['index.js'],
            bundle: true,
            write: false,
            plugins: [
                unpkgPathPlugin, 
                fetchPlugin(input)
            ],
            define: {
                'process.env.NODE_ENV': '"production"',
                 global: 'window'
            }
        });
        setCode(result.outputFiles[0].text);
    };

    return (
        <div>
            <textarea value={input} onChange={(e)=> setInput(e.target.value)}></textarea>
            <div>
                <button onClick={submitHandler}>Submit</button>
            </div>
            <pre>{code}</pre>
        </div>
    )
}


ReactDOM.render(
    <App />,
    document.querySelector('#root')
);
