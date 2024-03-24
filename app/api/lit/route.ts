// import * as LitJsSdk from "@lit-protocol/lit-node-client-nodejs";
// import { getAuthSig } from "../../../lib/helpers";
// import { NextResponse } from "next/server";

// export default async function POST(req: any, re: any) {
//   try {
//     const authSig = await getAuthSig();

//     const litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
//       alertWhenUnauthorized: false,
//       litNetwork: "cayenne",
//       debug: true,
//     });

//     await litNodeClient.connect();

    


//     // const accessControlConditions = [
//     //   {
//     //     contractAddress: "0x89b597199dAc806Ceecfc091e56044D34E59985c",
//     //     standardContractType: "ERC721",
//     //     chain: "ethereum",
//     //     method: "ownerOf",
//     //     parameters: ["3112"],
//     //     returnValueTest: {
//     //       comparator: "=",
//     //       value: ":userAddress",
//     //     },
//     //   },
//     // ];

//     const accessControlConditions = [
//       {
//         contractAddress: "0xA80617371A5f511Bf4c1dDf822E6040acaa63e71",
//         standardContractType: "ERC721",
//         chain: "ethereum",
//         method: "balanceOf",
//         parameters: [":userAddress"],
//         returnValueTest: {
//           comparator: ">",
//           value: "0",
//         },
//       },
//     ];

//     const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
//       {
//         accessControlConditions,
//         authSig,
//         chain: "ethereum",
//         dataToEncrypt: "This is a secret message", 
//       },
//       LitNodeClient
//     );

//     console.log(
//       "ciphertext ",
//       //@ts-ignore
//       LitJsSdk.uint8arrayToString(ciphertext, "base16")
//     );

//     console.log("Data encrypted.  Now to decrypt it.");

//     const decryptedString = await LitJsSdk.decryptToString(
//       {
//         accessControlConditions,
//         ciphertext,
//         dataToEncryptHash,
//         authSig,
//         chain: "ethereum",
//       },
//       LitNodeClient
//     );

//     console.log("decryptedString: ", decryptedString);

//     // Respond with the ciphertext and decryptedString
//     return NextResponse.json(
//       {
//         //@ts-ignore
//         ciphertext: LitJsSdk.uint8arrayToString(ciphertext, "base16"),
//         decryptedString,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: "An error occurred" }, { status: 500 });
//   }
// }
