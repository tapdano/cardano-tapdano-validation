use aiken/bytearray
use aiken/list
use aiken/string
use aiken/transaction.{
  OutputReference, ScriptContext, Spend, Transaction, TransactionId,
}
use aiken/transaction/credential.{Signature, VerificationKey, verify_signature}

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
          verify_signature(datum.public_key, message, redeemer.signature)
        },
      )
    valid?
  }
}

test spend_test() {
  let datum =
    Datum {
      public_key: #"aaf966740949d8794b1a0382dbcd919e9b7e90220f707513e7168a1c8cea06c6",
      data: #"00",
    }
  let redeemer =
    Redeemer {
      signature: #"2a12441b567de631ee017718c982fd3e58ad3c7c8931b2ad642d40c9856ae00864ff0300a95ea256c6d041e0dd2d5628b3bd26bb8e8d357df8255a60437d0504",
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
