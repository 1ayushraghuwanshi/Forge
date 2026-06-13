import { Plan } from "@/types/plan";
import { currentUser, auth } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { PLANS } from "./constants";

const getCurrentPlan = async():Promise<Plan>=>{
    const { has } = await auth();
    if(has({ plan: "pro" })) return "pro";
    if(has({plan: "starter"})) return "starter";
    return "free";
};

export const checkUser = async () => {
    const user = await currentUser();
    if(!user) return null;

    try{
        const currentPlan = await getCurrentPlan();

        const existing = await db.user.findUnique({
            where: {clerkId: user.id},
        })
     if (existing) {
      if (existing.plan !== currentPlan) {
     
//Plan changes - top up to new plan's credit allocation
//Does not reset existing credits, gives them the new plan's amount
       return  await db.user.update({
          where: { clerkId: user.id },
          data: {
            plan: currentPlan,
            credits:   existing.credits + PLANS[currentPlan].credits,
            },
        });
    }
    return existing;
}
//New User - create with free plan credits
 return await db.user.create({
      data: {
        clerkId: user.id,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl ?? "",
        credits: PLANS.free.credits,
        plan: "free",
      },
    });

    }catch(err){
  console.log("checkUser error:", err);
  return null;
    }
}