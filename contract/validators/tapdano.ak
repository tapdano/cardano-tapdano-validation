use aiken/bytearray
use aiken/transaction.{OutputReference, ScriptContext, Spend, TransactionId}
use aiken/transaction/credential.{Signature, VerificationKey, verify_signature}

type Datum {
  public_key: VerificationKey,
}

type Redeemer {
  data: ByteArray,
  signature: Signature,
}

validator {
  fn spend(datum: Datum, redeemer: Redeemer, _context: ScriptContext) -> Bool {
    trace bytearray.to_hex(datum.public_key)
    trace bytearray.to_hex(redeemer.data)
    trace bytearray.to_hex(redeemer.signature)
    let valid =
      verify_signature(datum.public_key, redeemer.data, redeemer.signature)
    valid?
  }
}

test spend_test() {
  let datum =
    Datum {
      public_key: #"fb3f51ecebe1ca9aaa17e2cff221226c3af1b10bd03b1950b1c0b74b37fe750c",
    }
  let redeemer =
    Redeemer {
      data: #"aabbcc",
      signature: #"b15b8b08a23e595158d8ffc9fc3666062367a0d6df2432c71dc84190edb0e5471a393d3f85c047539fa3bf9146874fb3ff50c3464a4a674002048f316fe1880f",
    }
  let placeholder_utxo =
    OutputReference { transaction_id: TransactionId(""), output_index: 0 }
  let context =
    ScriptContext {
      purpose: Spend(placeholder_utxo),
      transaction: transaction.placeholder(),
    }
  spend(datum, redeemer, context)
}
