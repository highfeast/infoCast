import fs from 'fs';
import path from 'path';
import { createWalletClient, http } from 'viem';
import { DIDSession } from 'did-session';
import { EthereumNodeAuth, getAccountId } from '@didtools/pkh-ethereum';
import { ComposeClient } from '@composedb/client';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { definition } from '../../../lib/__generated__/definition';
import { RuntimeCompositeDefinition } from '@composedb/types';
import { NextResponse } from 'next/server';

const sessionFilePath = path.join(
  process.cwd(),
  'composedb/data',
  'session.json'
);

export async function POST(req: any, res: any) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not alloweed' }, { status: 405 });
  }

  try {
    const ceramic = new CeramicClient('http://localhost:7007/');
    const compose = new ComposeClient({
      ceramic: 'http://localhost:7007/',
      //@ts-ignore
      definition: definition as RuntimeCompositeDefinition,
    });

    let session;
    const client = createWalletClient({
      transport: http('http://localhost:8545'),
    });

    try {
      const sessionData = fs.readFileSync(sessionFilePath, 'utf8');

      if (sessionData) {
        session = await DIDSession.fromSession(sessionData);
        console.log('my session data', sessionData);
      }
    } catch (err) {
      console.log("Error reading file doesn't");
    }

    if (!session || (session.hasSession && session.isExpired)) {
      const account = await client.getAddresses();
      const accountAddress = account[0];
      const accountId = await getAccountId(client.transport, accountAddress);

      const authMethod = await EthereumNodeAuth.getAuthMethod(
        client.transport,
        accountId,
        'infoCast'
      );

      session = await DIDSession.authorize(authMethod as any, {
        resources: ['ceramic://*'],
      });

      fs.mkdirSync(path.dirname(sessionFilePath), { recursive: true });
      fs.writeFileSync(sessionFilePath, session.serialize());
    }

    if (session) {
      compose.setDID(session.did as any);
      //@ts-ignore
      ceramic.did = session.did;
      const didParentFilePath = path.join(
        process.cwd(),
        'composedb/data',
        'did.txt'
      );
      fs.mkdirSync(path.dirname(didParentFilePath), { recursive: true });
      fs.writeFileSync(didParentFilePath, session.did.parent);
    }
    return NextResponse.json({ message: 'info update' });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
