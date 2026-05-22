import type { MutationCtx } from "./_generated/server";
import type { SeededUsers } from "./seedUsers";

export async function seedApplications(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<void> {
  await ctx.db.insert("applications", {
    userEmail: "emma.watson@example.com",
    fullName: "Emma Watson",
    birthdate: "2010-03-15",
    school: "Cornerstone Academy",
    graduationYear: 2028,
    faithStatement: "My faith is the foundation of everything I do. I believe God has given me a passion for technology and entrepreneurship to serve others and make a positive impact in my community. Through my church youth group, I've learned the importance of servant leadership and using our gifts to glorify God.",
    parentFirstName: "Margaret",
    parentLastName: "Watson",
    parentRelation: "Mother",
    parentEmail: "margaret.watson@example.com",
    parentPhone: "(555) 123-4567",
    status: "pending",
  });

  await ctx.db.insert("applications", {
    userEmail: "liam.johnson@example.com",
    fullName: "Liam Johnson",
    birthdate: "2011-07-22",
    school: "Faith Academy",
    graduationYear: 2029,
    faithStatement: "Growing up in a Christian household, I've always known that my purpose is to use my talents to serve God's kingdom. I see entrepreneurship as a way to create solutions that honor God and help people in need.",
    parentFirstName: "Robert",
    parentLastName: "Johnson",
    parentRelation: "Father",
    parentEmail: "robert.johnson@example.com",
    parentPhone: "(555) 234-5678",
    status: "pending",
  });

  await ctx.db.insert("applications", {
    userEmail: "olivia.brown@example.com",
    fullName: "Olivia Brown",
    birthdate: "2009-11-04",
    school: "Grace Christian School",
    graduationYear: 2027,
    faithStatement: "My faith journey has taught me that every talent we have is a gift meant to be shared. I want to combine my love for business with my desire to make the world a better place through Christ-centered innovation.",
    parentFirstName: "Jennifer",
    parentLastName: "Brown",
    parentRelation: "Mother",
    parentEmail: "jennifer.brown@example.com",
    parentPhone: "(555) 345-6789",
    status: "pending",
  });

  // Two already-processed applications
  await ctx.db.insert("applications", {
    userEmail: "sarah.chen@example.com",
    fullName: "Sarah Chen",
    birthdate: "2010-05-18",
    school: "Grace Academy",
    graduationYear: 2027,
    faithStatement: "Faith drives my curiosity about the world. I see technology as a tool God has given us to steward creation.",
    parentFirstName: "Linda",
    parentLastName: "Chen",
    parentRelation: "Mother",
    parentEmail: "linda.chen@example.com",
    parentPhone: "(555) 456-7890",
    status: "approved",
    reviewerId: users.jake,
    reviewerNotes: "Outstanding application. Strong technical skills and clear vision.",
    reviewedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  });

  await ctx.db.insert("applications", {
    userEmail: "rejected.applicant@example.com",
    fullName: "Test Applicant",
    birthdate: "2012-01-10",
    school: "Some School",
    graduationYear: 2030,
    faithStatement: "Short statement.",
    parentFirstName: "Parent",
    parentLastName: "Name",
    parentRelation: "Guardian",
    parentEmail: "parent@example.com",
    parentPhone: "(555) 000-0000",
    status: "rejected",
    reviewerId: users.jake,
    reviewerNotes: "Application lacks depth. Encouraged to reapply next cycle.",
    reviewedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  });

  console.log("   ✅ Created 5 applications");
}

export async function seedNominators(
  ctx: MutationCtx,
  users: SeededUsers,
): Promise<void> {
  await ctx.db.insert("nominators", {
    email: "adam@jupiter-school.example",
    fullName: "Adam Richardson",
    companyWebsite: "https://jupiter-school.example",
    status: "approved",
    source: "admin_added",
    approvedById: users.jake,
    approvedAt: Date.now(),
  });
  await ctx.db.insert("nominators", {
    email: "connor.precisionworks@gmail.com",
    fullName: "Connor Dore",
    status: "approved",
    source: "admin_added",
    approvedById: users.jake,
    approvedAt: Date.now(),
  });
  await ctx.db.insert("nominators", {
    email: "jonahwelliott@gmail.com",
    fullName: "Jonah Elliott",
    status: "approved",
    source: "admin_added",
    approvedById: users.jake,
    approvedAt: Date.now(),
  });
  console.log("   ✅ Created 3 approved nominators");
}
