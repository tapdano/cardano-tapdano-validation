import { Lucid, Data, Blockfrost, Constr } from "https://unpkg.com/lucid-cardano@0.10.7/web/mod.js";

(async () => {
  try {
    const lucid = await Lucid.new(
      new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprodZ7oYst1M80Svc1AINDBty3eptaGC7Et9"),
      "Preprod",
    );
    /*
    const lucid = await Lucid.new(
      new Blockfrost("https://cardano-mainnet.blockfrost.io/api/v0", "mainnetbjsUXNR6B9PMynZubxljYrNCTbZDWVEY"),
      "Mainnet",
    );
    */

    const api = await window.cardano.nami.enable();
    lucid.selectWallet(api);
    //lucid.selectWalletFromPrivateKey(privateKey);

    const publicKeyHash = lucid.utils.getAddressDetails(await lucid.wallet.address()).paymentCredential?.hash;
    console.log('Wallet PublicKey:' + publicKeyHash);

    const validador = {
      type: "PlutusV2",
      //script: "510100003222253330044a229309b2b2b9a1",
      //script: "58e901000032323232323223223225333006323253330083371e6eb8c008c028dd5002a4410d48656c6c6f2c20576f726c642100100114a06644646600200200644a66601c00229404c94ccc030cdc79bae301000200414a226600600600260200026eb0c02cc030c030c030c030c030c030c030c030c024dd5180098049baa002375c600260126ea80188c02c0045261365653330043370e900018029baa001132325333009300b002149858dd7180480098031baa0011653330023370e900018019baa0011323253330073009002149858dd7180380098021baa001165734aae7555cf2ab9f5742ae881",
      script: "589d010000323232323232232232253330063233372a6eb8c004c024dd50031bae3001300937540086eb8c02cc030c024dd5002118058008a4c26caca66600866e1d200030053754002264646464a666016601a0042930b1bae300b001300b002375c6012002600c6ea8004594ccc008cdc3a400060066ea80044c8c94ccc01cc02400852616375c600e00260086ea8004595cd2ab9d5573caae7d5d0aba21",
    };
    
    const contractAddress = lucid.utils.validatorToAddress(validador);
    console.log('Contract Address:' + contractAddress);

    /*
    const tx = await lucid.newTx()
      .payToAddress("addr_test1qz85fhv59gaucxnad6sl30wupyfvc8zvdem5xf2dc00sy5qxe7m8w0fur60gm3qrfaslknek44wd6t5jr9t5qa403szqzn4ykl", { lovelace: 5000000n })
      .complete();
    */

    //const datum = Data.to(new Constr(0, [publicKeyHash]));
    const datum = Data.to(new Constr(0, ["fb3f51ecebe1ca9aaa17e2cff221226c3af1b10bd03b1950b1c0b74b37fe750c"]));

    /*
    const tx = await lucid.newTx().payToContract(contractAddress, { inline: datum }, {
      lovelace: 10000000n,
    }).complete();
    */

    const allScriptUtxo = await lucid.utxosAt(contractAddress);
    console.log('All Contract UTxO:');
    console.log(allScriptUtxo);

    //const redeemer = Data.to(new Constr(0, [utf8ToHex("Hello, World!")]));
    const redeemer = Data.to(new Constr(0, ["aabbcc", "b15b8b08a23e595158d8ffc9fc3666062367a0d6df2432c71dc84190edb0e5471a393d3f85c047539fa3bf9146874fb3ff50c3464a4a674002048f316fe1880f"]));
    console.log('redeemer:', redeemer);

    const utxoToCollect = [];
    utxoToCollect.push(allScriptUtxo[allScriptUtxo.length - 1]);
    console.log('utxoToCollect:', utxoToCollect);

    //const [scriptUtxo] = await lucid.utxosAt(contractAddress);
    //console.log('BBBB');
    //console.log(scriptUtxo);
    /*
    const scriptUtxo = {
      address: contractAddress,
      assets: {
        lovelace: 40000000n
      },
      outputIndex: 0,
      txHash: '74073c466131dc47aaf6617519bd0757806282245708cf815fd8f0ef8d95d101'
    };
    */
    /*
    for (let i = 0; i < allScriptUtxo.length; i++) {
      if (allScriptUtxo[i].datum || allScriptUtxo[i].datumHash) {
        utxoToCollect.push(allScriptUtxo[i]);
        if (utxoToCollect.length == 20) break;
      }
    }
    */

    const tx = await lucid.newTx()
      .collectFrom(utxoToCollect, redeemer)
      .attachSpendingValidator(validador)
      .complete();

    /*
    const tx = await lucid.newTx()
      .collectFrom(utxoToCollect, redeemer)
      .addSigner(await lucid.wallet.address())
      .attachSpendingValidator(validador)
      .complete();
    */

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log('TX:' + txHash);

  } catch (error) {
    console.error("Error creating transaction:", error);
  }
})();

function utf8ToHex(str) {
  return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}