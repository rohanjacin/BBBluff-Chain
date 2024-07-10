"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Component } from "react";
import Image from "next/image";

const added = false;

export interface PlayerProps {
  wallet?: string;
  onConnectWallet: () => void;
  onJoin: () => void;
  //onClaim: () => void;
}

export function Player({
  wallet,
  onConnectWallet,
  onJoin,
  //onClaim,
}: PlayerProps) {
  const form = useForm();
  let deck;
  return (
    <Card className="w-60 h-80 p-0">
      <div 
        className="mb-2">
        <h2 className="text-xl font-bold">Cards</h2>
        <p className="mt-1 text-sm text-zinc-500">
          dealt cards
        </p>
      </div>
      <Form {...form}>
      {(added == true) ? (
          <Button
            size={"lg"}
            type="submit"
            className="mt-0 w-full"
            onClick={() => {
              wallet ?? onConnectWallet();
              wallet && onClaim();
            }}
          >
            {wallet ? "Claim Cards" : "Connect wallet"}
          </Button>        
        ) : (
          <Button
            size={"lg"}
            type="submit"
            className="mt-0 w-full"
            onClick={() => {
              console.log("On join click")
              wallet ?? onConnectWallet();
              wallet && onJoin();
              console.log("On join click done")
            }}
          >
            {true ? "Join" : "Connect wallet"}
          </Button>
        )
      }
      </Form>
    </Card>
  );
}
