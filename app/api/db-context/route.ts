import fs from "fs";
import path from "path";
import { DIDSession } from "did-session";
import { ComposeClient } from "@composedb/client";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { definition } from "../../../lib/__generated__/definition";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { createRobotDID, handleError } from "../../../composedb/utils/ceramic";
import {
  createBasicProfile,
  followSelf,
  getBasicProfile,
  updateContext,
} from "../../../composedb/utils/profile";
import {
  getContext,
  getRobotProfile,
} from "../../../composedb/utils/data.utils";
import axios from "axios";
import { NextResponse } from "next/server";

const sessionFilePath = path.join(
  process.cwd(),
  "composedb/data",
  "session.json"
);
const didParentFilePath = path.join(process.cwd(), "composedb/data", "did.txt");
const robotDidParentFilePath = path.join(
  process.cwd(),
  "composedb/data",
  "robotdid.txt"
);
export async function GET(req: any, res: any) {
  try {
    const ceramic = new CeramicClient("http://localhost:7007/");
    const compose = new ComposeClient({
      ceramic: "http://localhost:7007/",
      //@ts-ignore
      definition: definition as RuntimeCompositeDefinition,
    });
    let session;

    const sessionStat = fs.statSync(sessionFilePath);

    if (sessionStat.size === 0) {
      axios
        .post("http://localhost:3000/api/connect-db", {})
        .then(async (response) => {
          if (response.status === 200) {
            const { account } = response.data;
            const newSessionData = fs.readFileSync(sessionFilePath, "utf8");
            console.log(newSessionData);
            if (newSessionData) {
              session = await DIDSession.fromSession(newSessionData);
            }
          } else {
            return NextResponse.json(
              { error: "Internal Server Error" },
              { status: 500 }
            );
          }
        })
        .catch((e) => {
          console.log(e.data);
        });
    } else {
      const sessionData = fs.readFileSync(sessionFilePath, "utf8");
      session = await DIDSession.fromSession(sessionData);
    }

    if (session) {
      compose.setDID(session.did as any);
      //@ts-ignore
      ceramic.did = session.did;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorId = fs.readFileSync(didParentFilePath, "utf8");

    const context = await getContext(authorId, compose);
    const profile = await getBasicProfile(compose);
    const robotProfile = await getRobotProfile(compose, authorId, ceramic);

    if (context === null) {
      return NextResponse.json({ error: "Context not found" }, { status: 404 });
    }
    return NextResponse.json(
      { context, profile, robotProfile },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: any, res: any) {
  try {
    const ceramic = new CeramicClient("http://localhost:7007/");
    const compose = new ComposeClient({
      ceramic: "http://localhost:7007/",
      //@ts-ignore
      definition: definition as RuntimeCompositeDefinition,
    });
    let session;

    const sessionStat = fs.statSync(sessionFilePath);

    if (sessionStat.size === 0) {
      axios
        .post("http://localhost:3000/api/connect-db", {})
        .then(async (response) => {
          if (response.status === 200) {
            const { account } = response.data;
            const newSessionData = fs.readFileSync(sessionFilePath, "utf8");
            console.log(newSessionData);
            if (newSessionData) {
              session = await DIDSession.fromSession(newSessionData);
            }
          } else {
            return NextResponse.json(
              { error: "Internal Server Error" },
              { status: 500 }
            );
          }
        })
        .catch((e) => {
          console.log(e.data);
        });
    } else {
      const sessionData = fs.readFileSync(sessionFilePath, "utf8");
      session = await DIDSession.fromSession(sessionData);
    }

    if (session) {
      compose.setDID(session.did as any);
      //@ts-ignore
      ceramic.did = session.did;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authorId = fs.readFileSync(didParentFilePath, "utf8");

    const { context } = req.body;
    const updateContextResult = await updateContext(context, authorId, compose);

    if (updateContextResult.errors) {
      return handleError(res, updateContextResult.errors);
    }

    const createdProfile = await createBasicProfile(compose);

    if (createdProfile.errors) {
      return handleError(res, createdProfile.errors);
    }

    console.log("Created profile.");

    const profileData = await getBasicProfile(compose);
    const followSelfResult = await followSelf(
      profileData?.data?.viewer?.basicProfile.id,
      compose
    );

    if (followSelfResult.errors) {
      return handleError(res, followSelfResult.errors);
    }

    console.log("Followed self.");

    const robotDID = await createRobotDID(authorId, ceramic, compose);

    if (robotDID) {
      const didParentFilePath = path.join(
        process.cwd(),
        "composedb/data",
        "robotdid.txt"
      );
      fs.mkdirSync(path.dirname(didParentFilePath), { recursive: true });
      fs.writeFileSync(didParentFilePath, robotDID);
      console.log("Robot DID saved to file");
    }
    return res
      .status(200)
      .json({ message: "Context, profile and robotProfile updated" });
  } catch (err) {
    console.error(err);
    return new NextResponse(null);
  }
}
