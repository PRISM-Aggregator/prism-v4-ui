import { DCAWidget } from "@/components/DCAWidget";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import Head from "next/head";



const DcaPage = () => {
  return <div className="flex flex-col items-center h-full w-full gap-4">
    <Head>
      <title>
        DCA | Prism
      </title>
      <meta property="og:title" content={"DCA | Prism"} />
      <meta property="og:description" content={`DCA in and out of your favorite tokens easily, set recurring orders & forget.`} />
      <meta property="og:image" content={"https://i.imgur.com/zGzTTf0.png"} />
      <meta name="twitter:image" content={"https://i.imgur.com/zGzTTf0.png"} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
    <Header path={"/dca"}/>
    <div className="w-full flex flex-col items-center justify-center px-2 md:px-4">
      <h1 className="text-2xl text-white font-bold">Dollar Cost Averaging</h1>
      <p className="text-lg text-muted-foreground text-center">
        Easiest way to set up recurring orders
      </p>
    </div>
    <DCAWidget/>
  </div>
}

export default DcaPage;