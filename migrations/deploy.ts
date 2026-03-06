import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);

  const program = anchor.workspace.Keyfi;
  const treasury = provider.wallet.publicKey; // Use deployer as initial treasury

  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Initializing KeyFi protocol...");
  console.log("  Program ID:", program.programId.toBase58());
  console.log("  Config PDA:", configPda.toBase58());
  console.log("  Treasury:  ", treasury.toBase58());

  await program.methods
    .initialize(treasury)
    .accounts({
      authority: provider.wallet.publicKey,
      config: configPda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("KeyFi protocol initialized successfully.");
};
