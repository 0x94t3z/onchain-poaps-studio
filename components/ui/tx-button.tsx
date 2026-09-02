"use client";
import { useEffect, useRef } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { ContractFunctionArgs, ContractFunctionName } from "viem";
import type { TransactionReceipt } from "viem";
import { poapAbi } from "@/lib/blockchain/abi";
import { CONTRACT, explorer } from "@/lib/blockchain/constants";
import { friendlyTransactionError } from "@/lib/utils/transaction-error";
export function TxButton<
  T extends ContractFunctionName<typeof poapAbi, "nonpayable">,
>({
  name,
  args,
  label,
  disabled,
  onSuccess,
  wide = true,
  variant = "primary",
  showSuccess = true,
}: {
  name: T;
  args: ContractFunctionArgs<typeof poapAbi, "nonpayable", T>;
  label: string;
  disabled?: boolean;
  onSuccess?: (receipt: TransactionReceipt) => void;
  wide?: boolean;
  variant?: "primary" | "secondary";
  showSuccess?: boolean;
}) {
  const { writeContract, data, error, isPending, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: data });
  const notifiedHash = useRef<string | undefined>(undefined);
  const transactionSucceeded =
    receipt.isSuccess && receipt.data?.status === "success";
  const transactionReverted =
    receipt.isSuccess && receipt.data?.status === "reverted";
  const receiptIsUncertain = Boolean(data) && receipt.isError;

  useEffect(() => {
    if (!transactionSucceeded || !data || notifiedHash.current === data) return;
    notifiedHash.current = data;
    if (receipt.data) onSuccess?.(receipt.data);
  }, [data, onSuccess, receipt.data, transactionSucceeded]);

  function submit() {
    reset();
    notifiedHash.current = undefined;
    writeContract({
      address: CONTRACT,
      abi: poapAbi,
      functionName: name,
      args,
    } as any);
  }

  if (transactionSucceeded && !showSuccess) return null;
  if (transactionSucceeded)
    return (
      <div className="success">
        Confirmed onchain ·{" "}
        <a target="_blank" rel="noreferrer" href={explorer(`tx/${data}`)}>
          View transaction ↗
        </a>
      </div>
    );
  return (
    <div>
      <button
        type="button"
        className={
          "button" +
          (wide ? " wide" : "") +
          (variant === "secondary" ? " secondary" : "")
        }
        disabled={
          disabled || isPending || receipt.isLoading || receiptIsUncertain
        }
        onClick={submit}
      >
        {isPending
          ? "Confirm in wallet"
          : receipt.isLoading
            ? "Confirming…"
            : receiptIsUncertain
              ? "Check transaction status"
              : label}
      </button>
      {transactionReverted && (
        <p className="error" role="alert">
          The transaction reverted onchain and no change was made. Review the
          details and try again.{" "}
          <a target="_blank" rel="noreferrer" href={explorer(`tx/${data}`)}>
            View transaction ↗
          </a>
        </p>
      )}
      {receiptIsUncertain && (
        <p className="error" role="alert">
          The transaction was submitted, but its status could not be confirmed.
          Check it before submitting again.{" "}
          <a target="_blank" rel="noreferrer" href={explorer(`tx/${data}`)}>
            Check transaction ↗
          </a>
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {friendlyTransactionError(error, name)}
        </p>
      )}
    </div>
  );
}
