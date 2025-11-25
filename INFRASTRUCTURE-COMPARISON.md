# Infrastructure as Code Comparison

## Code Comparison

| Method | Lines of Code | Language | Learning Curve |
|--------|--------------|----------|----------------|
| **Manual AWS CLI** | ~50 commands | Bash | Easy |
| **Terraform** | ~180 lines | HCL | Medium |
| **AWS CDK** | ~110 lines | TypeScript | Medium-Hard |

---

## Terraform

**File:** `infrastructure/terraform/main.tf` (~180 lines)

### Pros
✅ **Cloud-agnostic** - Can manage AWS, GCP, Azure  
✅ **Declarative** - Describe what you want, not how  
✅ **State management** - Tracks what's deployed  
✅ **Popular** - Huge community, lots of examples  
✅ **Plan before apply** - See changes before deploying

### Cons
❌ **Extra tool** - Need to install Terraform CLI  
❌ **State file** - Need to store terraform.tfstate  
❌ **HCL syntax** - New language to learn  
❌ **No type safety** - Can't catch errors until runtime

### Deploy Steps
```bash
# Install Terraform
brew install terraform

# Initialize
cd infrastructure/terraform
terraform init

# See what will be created
terraform plan

# Create infrastructure
terraform apply

# Deploy your code (still uses GitHub Actions)
git push
```

### When Changes Happen
```bash
# Update main.tf
terraform plan   # See what changes
terraform apply  # Apply changes
```

---

## AWS CDK (Cloud Development Kit)

**File:** `infrastructure/cdk/lib/court-reserver-stack.ts` (~110 lines)

### Pros
✅ **TypeScript** - You already know it!  
✅ **Type-safe** - Catch errors at compile time  
✅ **Less code** - High-level constructs  
✅ **AWS-native** - Best AWS integration  
✅ **Object-oriented** - Reusable components  
✅ **Generates CloudFormation** - AWS's native IaC

### Cons
❌ **AWS-only** - Can't use for other clouds  
❌ **More complex** - Bigger learning curve  
❌ **Extra dependencies** - npm packages  
❌ **CloudFormation limits** - Some edge cases tricky

### Deploy Steps
```bash
# Install CDK
npm install -g aws-cdk

# Initialize (already done)
cd infrastructure/cdk
npm install

# Bootstrap (one-time)
cdk bootstrap

# See what will be created
cdk diff

# Create infrastructure
cdk deploy

# Deploy your code (still uses GitHub Actions)
git push
```

### When Changes Happen
```bash
# Update stack.ts
cdk diff     # See what changes
cdk deploy   # Apply changes
```

---

## Manual AWS CLI

**File:** `AWS-SETUP.md` (~50 commands)

### Pros
✅ **Simple** - No extra tools  
✅ **Transparent** - See exactly what happens  
✅ **Quick** - Fastest to get started  
✅ **Debugging** - Easy to understand errors  
✅ **No state files** - No extra files to manage

### Cons
❌ **Not reproducible** - Hard to recreate from scratch  
❌ **Manual tracking** - Must remember what you created  
❌ **No diff** - Can't preview changes  
❌ **Error-prone** - Easy to miss a step  
❌ **Not version controlled** - Commands not tracked

### Deploy Steps
```bash
# Run commands from AWS-SETUP.md once
# Then everything auto-deploys via GitHub Actions
git push
```

---

## Recommendation for Your Project

### If you want to **get running NOW**: Manual CLI ✅
- Fastest to deploy (10 minutes)
- Simplest for a single-purpose project
- You'll have it working today

### If you want to **learn TypeScript IaC**: AWS CDK
- Great if you want to level up your skills
- Type-safe infrastructure code
- Fun to work with if you like TypeScript

### If you might **move to multi-cloud**: Terraform
- Better if you'll use multiple cloud providers
- Industry standard, good resume skill
- Slightly more code but very powerful

---

## My Honest Opinion

For a **court reservation bot** that you'll run twice a week:

**Use Manual CLI Setup** 🎯

Why?
- You're not managing complex infrastructure
- It's just 1 Lambda + 1 Schedule + 1 ECR repo
- IaC is overkill for this use case
- Save the complexity for when you need it

**When would I use IaC?**
- If you had 10+ Lambda functions
- If you needed multiple environments (dev/staging/prod)
- If multiple people were deploying
- If you were running a business on this

For your personal project? Keep it simple. The manual setup works great and GitHub Actions handles all future deploys automatically.

---

## Cost Comparison

All three options have the **same AWS cost** (~$0.10/month for ECR storage).

The difference is your time:
- **Manual**: 10 minutes once
- **Terraform**: 30 minutes setup + 20 min learning
- **CDK**: 45 minutes setup + 30 min learning

After initial setup, all three auto-deploy the same way via GitHub Actions.

