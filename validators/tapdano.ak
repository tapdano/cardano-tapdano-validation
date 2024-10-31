use aiken/builtin.{sha2_256, verify_ecdsa_secp256k1_signature}
use aiken/bytearray
use aiken/cbor
use aiken/list
use aiken/string
use aiken/transaction.{
  OutputReference, ScriptContext, Spend, Transaction, TransactionId,
}
use aiken/transaction/credential.{Signature, VerificationKey}

type Datum {
  public_key: VerificationKey,
  data: ByteArray,
}

type Redeemer {
  signature: Signature,
}

validator {
  fn spend(datum: Datum, redeemer: Redeemer, context: ScriptContext) -> Bool {
    expect Spend(output_reference) = context.purpose

    let valid =
      list.any(
        context.transaction.extra_signatories,
        fn(sig_pk) {
          let message =
            output_reference.transaction_id.hash
              |> bytearray.concat(
                  bytearray.from_string(
                    string.from_int(output_reference.output_index),
                  ),
                )
              |> bytearray.concat(sig_pk)
          trace @"datum.public_key"
          trace cbor.diagnostic(datum.public_key)
          trace @"message"
          trace cbor.diagnostic(message)
          trace @"redeemer.signature"
          trace cbor.diagnostic(redeemer.signature)
          let message_hash = sha2_256(message)
          trace @"message_hash"
          trace cbor.diagnostic(message_hash)
          verify_ecdsa_secp256k1_signature(
            datum.public_key,
            message_hash,
            redeemer.signature,
          )
        },
      )
    valid?
  }
}

test spend_test() {
  let datum =
    Datum {
      public_key: #"02a419381b4faa0e095cc91b0ac56ac4287c0c26bece03eb858c86920764b9eaa3",
      data: #"00",
    }
  let redeemer =
    Redeemer {
      signature: #"d02cdddacb0de16975d5b2f1045c673d7fa913c1422d2205068eb13f8807878f09ff13e4cf0b6fa959d61634262a5544593e878f330a15df9d0be5da19d786f0",
    }
  let placeholder_utxo =
    OutputReference {
      transaction_id: TransactionId(
        #"26cad25d44f6d8ef86427ad206e7e8a89808bfc3f5830a11dd3825b32a7fa4d1",
      ),
      output_index: 0,
    }

  let context =
    ScriptContext {
      purpose: Spend(placeholder_utxo),
      transaction: transaction.placeholder()
        |> fn(transaction) {
            Transaction {
              ..transaction,
              extra_signatories: [
                #"31ab577b94f16b06ed1951961d1df1f906fff51c7c8bcdde1eb5139ef9cd7d44",
              ],
            }
          },
    }

  spend(datum, redeemer, context)
}
