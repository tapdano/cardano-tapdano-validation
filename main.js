import { Lucid, Data, Blockfrost, Constr, C } from "https://unpkg.com/lucid-cardano@0.10.7/web/mod.js";

(async () => {
  try {

    const BLOCKFROST_URL = 'https://cardano-preprod.blockfrost.io/api/v0'; //https://cardano-mainnet.blockfrost.io/api/v0
    const BLOCKFROST_PROJECT_ID = 'preprodZ7oYst1M80Svc1AINDBty3eptaGC7Et9'; //mainnetbjsUXNR6B9PMynZubxljYrNCTbZDWVEY
    const BLOCKFROST_NETWORK = 'Preprod'; //Mainnet

    const TAG_PRIVATE_KEY = '0B95B995564ECCE86AFB7576431B45EB56A3AFF2D7844DBAFFF42AD0A372DC97';
    const TAG_PUBLIC_KEY = 'AAF966740949D8794B1A0382DBCD919E9B7E90220F707513E7168A1C8CEA06C6';

    const ACTION = 'UNLOCK';
    const CACHE_UTXO = false;
    const LOCK_ADA = 50000000n;

    const lucid = await Lucid.new(
      new Blockfrost(BLOCKFROST_URL, BLOCKFROST_PROJECT_ID),
      BLOCKFROST_NETWORK,
    );

    const api = await window.cardano.nami.enable();
    lucid.selectWallet(api); //lucid.selectWalletFromPrivateKey(privateKey);

    const publicKeyHash = lucid.utils.getAddressDetails(await lucid.wallet.address()).paymentCredential?.hash;
    console.log('Wallet PublicKey:' + publicKeyHash);

    const validador = {
      type: "PlutusV2",
      script: "5903ef01000032323232323232322323223225333007323253330093370e900118051baa0011323232330010013758602260246024602460246024602460246024601c6ea8c008c038dd50031129998080008a50132533300e323233372a6eb8c018c048dd50078009bae300630123754018646466e2800400ccdc50009b9832323232323732666002002601c602e6ea8031220100222533333301e00213232323232323300b00200133714911012800002533301b337100069007099b80483c80400c54ccc06ccdc4001a410004266e00cdc0241002800690068b299980e800899b8a4881035b5d2900004133714911035b5f2000375c603e604066600e0026603c980102415d003301e375266e2922010129000044bd70111981026103422c200033020375266601001000466e28dd718090009bae30150014bd701bac301b002375a60320026466ec0dd4180c8009ba7301a0013754004264a666036002266e292201027b7d00002133714911037b5f2000375c603a603c64646600200200644a66603c0022006266446604298103422c2000330213752666012012603c00466e292201023a2000333009009301f002337146eb8c04c004dd7180b000a5eb80c080004cc008008c084004cc0713010342207d003301c375200497ae03756004264a666036002266e29221025b5d00002133714911035b5f2000375c603a603c66600a00266038980102415d003301c375200497ae0223301e4c0103422c20003301e375266600c00c00466e28dd718080009bae30130014bd701bac002133005375a0040022646466e292210268270000132333001001337006e34009200133714911012700003222533301b3371000490000800899191919980300319b8000548004cdc599b80002533301e33710004900a0a40c02903719b8b33700002a66603c66e2000520141481805206e0043370c004901019b8300148080cdc70020011bae002222323300100100422533301b0011004133003301d00133002002301e001223233001001003225333016301400113371491101300000315333016337100029000099b8a489012d003300200233702900000089980299b8400148050cdc599b803370a002900a240c00066002002444a66602666e2400920001001133300300333708004900a19b8b3370066e14009201448180004dd7180298089baa30053011375400c6eb8c04c008528899801801800980980091808000980718059baa001163001300a37540044601a601c00229309b2b2999802980198031baa00113232533300a300d002149858dd7180580098039baa00116533300330013004375400426464a66601060160042930b1bae3009001300537540042c6e1d20005734aae7555cf2ab9f5740ae855d12ba41",
    };
    
    const contractAddress = lucid.utils.validatorToAddress(validador);
    console.log('Contract Address:' + contractAddress);

    if (ACTION == 'LOCK') {
      const datum = Data.to(new Constr(0, [TAG_PUBLIC_KEY]));

      const tx = await lucid.newTx().payToContract(contractAddress, { inline: datum }, {
        lovelace: LOCK_ADA,
      }).complete();

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();
      console.log('TX:' + txHash);
    }

    if (ACTION == 'UNLOCK') {
  
      let tx = await lucid.newTx();

      let utxoToCollect = deserializeBigInt(localStorage.getItem("utxoToCollect"));
      if (utxoToCollect == null || !CACHE_UTXO) {
        utxoToCollect = [];
        const allScriptUtxo = await lucid.utxosAt(contractAddress);
        console.log('All Contract UTxO:', allScriptUtxo);
          for (let i = 0; i < allScriptUtxo.length; i++) {
          if (allScriptUtxo[i].datum || allScriptUtxo[i].datumHash) {
            if (allScriptUtxo[i].datum.toUpperCase().indexOf(TAG_PUBLIC_KEY.toUpperCase()) == 10) {
              utxoToCollect.push(allScriptUtxo[i]);
              if (utxoToCollect.length == 20) break;
            }
          }
        }
        localStorage.setItem("utxoToCollect", serializeBigInt(utxoToCollect));
      }
      console.log('utxoToCollect:', utxoToCollect);
      if (utxoToCollect.length == 0) {
        console.log('UTXO NOT FOUND');
        return;
      }
  
      for (let i = 0; i < utxoToCollect.length; i++) {
        const message = utxoToCollect[i].txHash + utf8ToHex(String(utxoToCollect[i].outputIndex)) + publicKeyHash;
        console.log('message:', message);
  
        let sig = '';
        if (i == 0) sig = '49367A6413FD733D4F38DF1CCE75F61A29898FE29A0FB61E224DF9BAF7E0A3E714245F0F766315DF6C25AD4C3A07B9350A8048D97941FC56CE2B81CA8B5D2E0A';
  
        const redeemer = Data.to(new Constr(0, [sig]));
        console.log('redeemer:', redeemer);
  
        tx = tx.collectFrom([utxoToCollect[i]], redeemer);
      }

      tx = tx.addSigner(await lucid.wallet.address()).attachSpendingValidator(validador);

      console.log('tx', tx);
      const tx_bytes = tx.txBuilder.to_bytes();
      console.log('tx_bytes', toHex(tx_bytes));

      tx = await tx.complete();
      
      const tx_complete_bytes = tx.txComplete.to_bytes();
      console.log('tx_complete_bytes', toHex(tx_complete_bytes));

      console.log('body', toHex(tx.txComplete.body().to_bytes()));

      console.log('tx complete', tx);

      const signedTx = await tx.sign().complete();
      const txHash = await signedTx.submit();
      console.log('TX:' + txHash);
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
  }
})();

function utf8ToHex(str) {
  return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

function fromHex(hexString) {
  const byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
  return byteArray;
}

function toHex(byteArray) {
  return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

function serializeBigInt(obj) {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() + 'n' : value
  );
}

function deserializeBigInt(json) {
  return JSON.parse(json, (key, value) =>
    typeof value === 'string' && value.match(/^-?\d+n$/) ? BigInt(value.slice(0, -1)) : value
  );
}