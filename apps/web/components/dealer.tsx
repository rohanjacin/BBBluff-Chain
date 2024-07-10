"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Component } from "react";
import Image from "next/image";
import clubs from "@/public/2_of_clubs.png";

export interface DealerProps {
  wallet?: string;
  onConnectWallet: () => void;
  onAdd: () => void;
  onUpload: () => boolean;
  cardImage: () => void;
}

export function Dealer({
  wallet,
  onConnectWallet,
  onAdd,
  onUpload,
  cardImage,
}: DealerProps) {
  const form = useForm();
  return (
    <Card className="w-60 h-80 p-0">
      <div 
        className="mb-2">
        <h2 className="text-xl font-bold">CardDeck</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Add cards to the deck
        </p>
      </div>
      <Form {...form}>
        <Input
          type="file"
          onChange={(event) => {
            let file = event.target.files[0];
            setTimeout(() => {
              console.log("Uploading..");
              onUpload(file);
            }, 500);
          }}
        />
        <Button
          size={"lg"}
          type="submit"
          className="mt-0 w-full"
          onClick={() => {
            wallet ?? onConnectWallet();
            wallet && onAdd();
          }}
        >
          {wallet ? "Add Deck" : "Connect wallet"}
        </Button>
      </Form>
    </Card>
  );
}
