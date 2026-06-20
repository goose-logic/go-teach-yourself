import type { TestQuestion, ProjectBrief } from "@/lib/types"

export type DemoLesson = {
  title: string
  objective: string
  durationMinutes: number
  content: string
}

export type DemoAssessment =
  | { type: "test"; title: string; description: string; questions: TestQuestion[] }
  | { type: "project"; title: string; description: string; brief: ProjectBrief }

export type DemoModule = {
  weekNumber: number
  title: string
  summary: string
  lessons: DemoLesson[]
  assessment?: DemoAssessment
}

export type DemoCourse = {
  key: string
  title: string
  subject: string
  goal: string
  level: "beginner" | "intermediate" | "advanced"
  pace: "full_time" | "part_time"
  hoursPerWeek: number
  totalWeeks: number
  summary: string
  modules: DemoModule[]
}

// ---------------------------------------------------------------------------
// Cybersecurity
// ---------------------------------------------------------------------------
const cybersecurity: DemoCourse = {
  key: "cybersecurity",
  title: "Cybersecurity Foundations: From Threats to Defense",
  subject: "Cybersecurity",
  goal: "Break into an entry-level security role and pass the Security+ exam",
  level: "beginner",
  pace: "part_time",
  hoursPerWeek: 6,
  totalWeeks: 3,
  summary:
    "Build a practical foundation in cybersecurity — from the core principles that protect every system to the attacks defenders face and the controls used to stop them. You'll finish ready to reason about real-world security decisions.",
  modules: [
    {
      weekNumber: 1,
      title: "Security Principles & the CIA Triad",
      summary: "Understand what security actually protects and the vocabulary used across the field.",
      lessons: [
        {
          title: "The CIA Triad: Confidentiality, Integrity, Availability",
          objective: "Explain the three pillars of information security and how they trade off.",
          durationMinutes: 35,
          content: `## The foundation of everything

Almost every security decision comes back to three goals, known as the **CIA triad**:

- **Confidentiality** — only authorized people can read the data. Think encryption, access controls, and passwords.
- **Integrity** — data is accurate and hasn't been tampered with. Think hashing, checksums, and digital signatures.
- **Availability** — the system is up when legitimate users need it. Think redundancy, backups, and DDoS protection.

### Why it matters

Security is always a balancing act. Locking a system in a vault maximizes confidentiality but destroys availability. A great defender knows which pillar matters most for a given asset.

> A hospital prioritizes **availability** (systems must stay up to save lives), while a bank prioritizes **integrity** (a balance must never be wrong).

### Quick recap

When you evaluate any control, ask: *which pillar does this protect, and what does it cost the others?*`,
        },
        {
          title: "Threats, Vulnerabilities, and Risk",
          objective: "Distinguish between a threat, a vulnerability, and risk.",
          durationMinutes: 30,
          content: `## Speaking the language of risk

These three words are often confused, but they mean very different things:

- **Vulnerability** — a weakness (an unpatched server, a weak password).
- **Threat** — something that could exploit that weakness (a hacker, malware, a flood).
- **Risk** — the *likelihood* a threat exploits a vulnerability, times the *impact* if it does.

$$Risk = Likelihood \\times Impact$$

### Managing risk

Once you measure risk, you have four options:

1. **Mitigate** — add a control to reduce it (patch the server).
2. **Transfer** — shift it to someone else (buy cyber insurance).
3. **Accept** — decide it's small enough to live with.
4. **Avoid** — stop doing the risky activity entirely.

### Quick recap

You can't fix everything. Risk management is about spending limited resources where they reduce the most risk.`,
        },
      ],
      assessment: {
        type: "test",
        title: "Quiz: Security Principles",
        description: "Check your understanding of the CIA triad and core risk vocabulary.",
        questions: [
          {
            question: "A ransomware attack encrypts a company's files so staff cannot access them. Which pillar of the CIA triad is most directly affected?",
            options: ["Confidentiality", "Integrity", "Availability", "Authentication"],
            answerIndex: 2,
            explanation:
              "Availability is about legitimate users being able to access systems and data. Ransomware locks that access, even though the data still exists.",
          },
          {
            question: "An unpatched web server is best described as a:",
            options: ["Threat", "Vulnerability", "Risk", "Control"],
            answerIndex: 1,
            explanation: "A vulnerability is a weakness. A threat is what could exploit it; risk is the combination of likelihood and impact.",
          },
          {
            question: "Buying cyber-insurance is an example of which risk response?",
            options: ["Mitigate", "Accept", "Transfer", "Avoid"],
            answerIndex: 2,
            explanation: "Transferring risk shifts the financial impact to another party, such as an insurer.",
          },
          {
            question: "Using a cryptographic hash to verify a downloaded file primarily protects:",
            options: ["Confidentiality", "Integrity", "Availability", "Anonymity"],
            answerIndex: 1,
            explanation: "Hashes detect tampering, ensuring the data is exactly what was published — that's integrity.",
          },
        ],
      },
    },
    {
      weekNumber: 2,
      title: "Common Attacks & How They Work",
      summary: "Learn the attacks you'll defend against every day, starting with the human element.",
      lessons: [
        {
          title: "Social Engineering & Phishing",
          objective: "Identify the psychological levers attackers use and how to resist them.",
          durationMinutes: 35,
          content: `## Hacking the human

The easiest way into most organizations isn't the firewall — it's a person. **Social engineering** manipulates people into breaking security procedures.

### Common techniques

- **Phishing** — mass deceptive emails that lure victims into clicking links or entering credentials.
- **Spear phishing** — a targeted, personalized version aimed at a specific person.
- **Pretexting** — inventing a believable scenario ("I'm from IT, I need your password").
- **Baiting** — leaving infected USB drives where curious people will find them.

### The levers attackers pull

Authority, urgency, fear, and curiosity. An email that says *"Your account will be closed in 1 hour — click here"* uses urgency and fear to bypass your judgment.

### Quick recap

Slow down. Verify the sender through a separate channel. Legitimate organizations never demand passwords by email.`,
        },
        {
          title: "Malware Families",
          objective: "Classify the major types of malware by behavior.",
          durationMinutes: 30,
          content: `## Know your malware

"Malware" is an umbrella term. Defenders classify it by how it spreads and what it does:

- **Virus** — attaches to a file and needs a user to run it.
- **Worm** — self-replicating; spreads across networks with no user action.
- **Trojan** — disguised as legitimate software.
- **Ransomware** — encrypts data and demands payment.
- **Spyware** — secretly collects information.
- **Rootkit** — hides deep in the system to maintain stealthy access.

### Defense in depth

No single tool stops all of these. You layer controls: email filtering, endpoint protection, patching, least privilege, and backups so ransomware can't hold you hostage.

### Quick recap

Match the malware to its behavior, and you'll know which control blocks it.`,
        },
      ],
      assessment: {
        type: "test",
        title: "Quiz: Attacks & Malware",
        description: "Test your knowledge of social engineering and malware classification.",
        questions: [
          {
            question: "A self-replicating piece of malware that spreads across a network without any user action is a:",
            options: ["Virus", "Worm", "Trojan", "Rootkit"],
            answerIndex: 1,
            explanation: "Worms self-propagate over networks. Viruses, by contrast, require a user to execute an infected file.",
          },
          {
            question: "An email claiming your account closes in one hour unless you act now is primarily exploiting:",
            options: ["Curiosity", "Urgency", "Greed", "Authority"],
            answerIndex: 1,
            explanation: "A short deadline manufactures urgency, pressuring the target to act before thinking critically.",
          },
          {
            question: "Which control most directly limits the damage of a successful ransomware attack?",
            options: ["A stronger password policy", "Recent, tested offline backups", "A faster internet connection", "Disabling email"],
            answerIndex: 1,
            explanation: "If you can restore from clean backups, you can recover without paying the ransom.",
          },
        ],
      },
    },
    {
      weekNumber: 3,
      title: "Defensive Controls in Practice",
      summary: "Apply layered controls to protect a real system and document your reasoning.",
      lessons: [
        {
          title: "Authentication, MFA, and Least Privilege",
          objective: "Design an access strategy using modern authentication controls.",
          durationMinutes: 40,
          content: `## Proving who you are — and limiting what you can do

### The three factors of authentication

1. **Something you know** — a password or PIN.
2. **Something you have** — a phone, hardware token, or smart card.
3. **Something you are** — a fingerprint or face scan.

**Multi-factor authentication (MFA)** combines two or more. Even if an attacker steals your password, they can't log in without your second factor.

### Least privilege

Give every user and process *only* the access it needs — nothing more. If an account is compromised, least privilege contains the blast radius.

### Quick recap

Strong authentication keeps attackers out; least privilege limits the damage if they get in.`,
        },
        {
          title: "Network Defense: Firewalls & Segmentation",
          objective: "Explain how firewalls and segmentation contain attacks.",
          durationMinutes: 35,
          content: `## Building walls inside the network

### Firewalls

A firewall filters traffic based on rules — allowing or blocking connections by IP address, port, or protocol. It's your first line of network defense.

### Network segmentation

Instead of one flat network, you divide it into zones (e.g., guest Wi-Fi, employee workstations, servers). If attackers breach one zone, segmentation stops them from moving freely to the others — this is **limiting lateral movement**.

### Defense in depth, again

Firewalls + segmentation + monitoring + endpoint protection. Each layer assumes the others might fail.

### Quick recap

Don't trust your internal network by default. Segment it and watch the traffic between zones.`,
        },
      ],
      assessment: {
        type: "project",
        title: "Project: Secure a Small Business Network",
        description: "Apply layered controls to a realistic scenario and justify your decisions.",
        brief: {
          brief: `## Scenario

You've been hired as the first security consultant for **Maple Street Dental**, a 12-person clinic. They have:

- One shared Wi-Fi network for staff, patients, and smart devices.
- Patient records stored on a single Windows server.
- Staff who reuse the same password everywhere.
- No backups.

## Your task

Write a one-page security plan that lays out the controls you'd put in place in the first 90 days, and explain *why* each one matters using the concepts from this course.`,
          requirements: [
            "Propose an authentication strategy that includes MFA",
            "Describe how you'd segment the network and why",
            "Define a backup strategy that would survive a ransomware attack",
            "Apply the principle of least privilege to the patient records server",
            "Prioritize your controls by risk (likelihood × impact)",
          ],
          rubric: [
            "Controls clearly map to the CIA triad and real risks",
            "Reasoning is specific to the clinic's situation, not generic",
            "Plan is realistic for a 12-person budget",
            "Demonstrates defense-in-depth thinking",
          ],
        },
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// Product Management
// ---------------------------------------------------------------------------
const productManagement: DemoCourse = {
  key: "product-management",
  title: "Product Management: From Idea to Launch",
  subject: "Product Management",
  goal: "Transition into an associate product manager role",
  level: "beginner",
  pace: "part_time",
  hoursPerWeek: 5,
  totalWeeks: 3,
  summary:
    "Learn how great products get built — from discovering real customer problems to prioritizing a roadmap and measuring success. You'll practice the core PM skills hiring managers look for.",
  modules: [
    {
      weekNumber: 1,
      title: "Discovery: Finding Problems Worth Solving",
      summary: "Start where every good product starts — with a real, validated customer problem.",
      lessons: [
        {
          title: "The Role of a Product Manager",
          objective: "Describe what a PM actually does and what they don't.",
          durationMinutes: 30,
          content: `## What does a PM really do?

A product manager sits at the intersection of **business**, **technology**, and **user experience**. You're not the boss of the engineers, and you don't write the code — you make sure the team builds the *right thing*.

### Your core responsibilities

- **Discover** what problems are worth solving.
- **Decide** what to build and in what order.
- **Align** engineering, design, marketing, and leadership around that plan.
- **Measure** whether it worked.

### The biggest myth

PMs are often called the "CEO of the product." That's misleading — you lead through **influence**, not authority. Your power comes from clear thinking, evidence, and trust.

### Quick recap

A PM's job is to maximize the value the team creates, mostly by making sure they solve real problems.`,
        },
        {
          title: "Customer Interviews & Jobs To Be Done",
          objective: "Run a customer interview that uncovers real needs.",
          durationMinutes: 35,
          content: `## Talk to users — the right way

The fastest way to build the wrong thing is to guess what customers want. Instead, interview them.

### Jobs To Be Done (JTBD)

People don't buy products; they "hire" them to get a job done. *"I don't want a drill, I want a hole in my wall."* Focus on the underlying job, not the feature requests.

### Interview rules

- Ask about **past behavior**, not hypotheticals. ("Tell me about the last time you…") not ("Would you use…?").
- Avoid leading questions.
- Listen 80% of the time.
- Dig into the *why* behind each answer.

### Quick recap

Great discovery means understanding the customer's job so deeply that the right solution becomes obvious.`,
        },
      ],
      assessment: {
        type: "test",
        title: "Quiz: Product Discovery",
        description: "Check your grasp of the PM role and discovery techniques.",
        questions: [
          {
            question: "Which statement best reflects the 'Jobs To Be Done' framework?",
            options: [
              "Customers always know exactly what features they want",
              "People hire products to make progress on an underlying goal",
              "The best product has the most features",
              "Roadmaps should be built from sales requests only",
            ],
            answerIndex: 1,
            explanation: "JTBD focuses on the underlying progress the customer is trying to make, not the surface-level feature request.",
          },
          {
            question: "Which interview question is most likely to give you reliable insight?",
            options: [
              "Would you pay for a feature like this?",
              "Don't you think this app is great?",
              "Tell me about the last time you faced this problem.",
              "Which of my three ideas do you like best?",
            ],
            answerIndex: 2,
            explanation: "Asking about concrete past behavior yields far more reliable data than hypothetical or leading questions.",
          },
          {
            question: "A product manager's authority over the engineering team is best described as:",
            options: ["Direct managerial authority", "Influence and trust", "Financial control", "None — they just take notes"],
            answerIndex: 1,
            explanation: "PMs typically don't manage engineers directly; they lead through influence, clear reasoning, and evidence.",
          },
        ],
      },
    },
    {
      weekNumber: 2,
      title: "Prioritization & Roadmapping",
      summary: "Turn a pile of ideas into a defensible plan.",
      lessons: [
        {
          title: "Prioritization Frameworks (RICE & MoSCoW)",
          objective: "Use a framework to rank competing ideas objectively.",
          durationMinutes: 35,
          content: `## You can't build everything

Prioritization is the heart of product management. Two popular frameworks:

### RICE

Score each idea by:

$$RICE = \\frac{Reach \\times Impact \\times Confidence}{Effort}$$

- **Reach** — how many users it affects.
- **Impact** — how much it moves the needle.
- **Confidence** — how sure you are (a discount for guesswork).
- **Effort** — person-months to build.

Higher score = build sooner.

### MoSCoW

Sort features into **Must have**, **Should have**, **Could have**, and **Won't have (this time)**. Simple and great for stakeholder conversations.

### Quick recap

Frameworks don't make the decision for you — they make your reasoning transparent and debatable.`,
        },
        {
          title: "Writing a Product Roadmap",
          objective: "Build an outcome-oriented roadmap instead of a feature list.",
          durationMinutes: 30,
          content: `## Roadmaps communicate strategy

A roadmap is not a list of features with dates. It's a communication tool that shows **what problems you'll tackle and why**.

### Outcome over output

- ❌ "Ship dark mode in Q2."
- ✅ "Reduce churn among power users by improving long-session comfort."

The second framing leaves room for the team to find the *best* solution.

### Now / Next / Later

A simple, honest format. Commit to the "Now" column, sketch "Next," and keep "Later" loose. It sets expectations without pretending you can predict month nine.

### Quick recap

Tie every roadmap item to an outcome and a metric, and you'll never struggle to justify it.`,
        },
      ],
      assessment: {
        type: "test",
        title: "Quiz: Prioritization",
        description: "Test your understanding of RICE, MoSCoW, and roadmapping.",
        questions: [
          {
            question: "In the RICE framework, which factor is essentially a discount for uncertainty?",
            options: ["Reach", "Impact", "Confidence", "Effort"],
            answerIndex: 2,
            explanation: "Confidence lowers the score when you're guessing, protecting you from over-investing in unvalidated ideas.",
          },
          {
            question: "Which is an example of an outcome-oriented roadmap item?",
            options: [
              "Ship a new settings page in March",
              "Add 12 new icons",
              "Increase trial-to-paid conversion by improving onboarding",
              "Rewrite the backend in a new language",
            ],
            answerIndex: 2,
            explanation: "It names a measurable outcome and leaves the team free to find the best solution, rather than dictating output.",
          },
          {
            question: "In MoSCoW, the 'W' stands for:",
            options: ["Will have", "Won't have (this time)", "Wish list", "Waiting"],
            answerIndex: 1,
            explanation: "'Won't have this time' explicitly parks items, which is just as important as deciding what's in scope.",
          },
        ],
      },
    },
    {
      weekNumber: 3,
      title: "Launch & Measurement",
      summary: "Define success up front and pitch your product like a PM.",
      lessons: [
        {
          title: "Defining Success Metrics",
          objective: "Choose metrics that reflect real value, not vanity.",
          durationMinutes: 30,
          content: `## If you can't measure it, you can't learn

### Vanity vs. actionable metrics

- **Vanity metric** — looks good, guides nothing (total registered users).
- **Actionable metric** — tied to a decision (weekly active users, conversion rate, retention).

### The North Star Metric

One metric that best captures the value your product delivers. For Spotify it might be *time spent listening*; for Airbnb, *nights booked*. Everything ladders up to it.

### Leading vs. lagging

Lagging metrics (revenue) tell you what happened. Leading metrics (activation rate) predict what's coming and give you time to react.

### Quick recap

Pick a North Star, support it with a few leading indicators, and ignore the vanity numbers.`,
        },
        {
          title: "The Product Pitch",
          objective: "Structure a crisp pitch that wins buy-in.",
          durationMinutes: 30,
          content: `## Selling the idea

Even the best plan dies without buy-in. A strong pitch follows a simple arc:

1. **The problem** — who hurts, and how much.
2. **The evidence** — what discovery taught you.
3. **The solution** — what you'll build, at a high level.
4. **The bet** — the outcome you expect and the metric you'll watch.
5. **The ask** — what you need (people, time, money).

### Tell a story

Open with a real customer's situation. Stakeholders remember stories far longer than slides full of bullet points.

### Quick recap

Problem → evidence → solution → bet → ask. Lead with the customer, close with a clear request.`,
        },
      ],
      assessment: {
        type: "project",
        title: "Project: Pitch a New Feature",
        description: "Put the whole course together by pitching a feature for a product you use.",
        brief: {
          brief: `## Your task

Pick a digital product you use regularly (or invent one). Identify a real problem its users face, and write a one-page product pitch proposing a feature to solve it.

Use the structure from the course: **problem → evidence → solution → bet → ask**. Imagine you're presenting to a VP who controls the budget.`,
          requirements: [
            "State the customer problem and who it affects",
            "Reference at least one piece of (real or plausible) discovery evidence",
            "Describe the proposed solution at a high level (no need for full specs)",
            "Define a North Star or success metric you'd watch",
            "Use RICE or MoSCoW to justify why this is worth doing now",
          ],
          rubric: [
            "The problem is specific and clearly worth solving",
            "Reasoning is evidence-based, not opinion-based",
            "Success is measurable and tied to value",
            "The pitch is concise and persuasive",
          ],
        },
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// Digital Marketing
// ---------------------------------------------------------------------------
const digitalMarketing: DemoCourse = {
  key: "digital-marketing",
  title: "Digital Marketing Essentials: Reach, Engage, Convert",
  subject: "Digital Marketing",
  goal: "Run effective marketing campaigns for a small business or side project",
  level: "beginner",
  pace: "part_time",
  hoursPerWeek: 5,
  totalWeeks: 3,
  summary:
    "Master the modern marketing funnel — how to attract the right audience, earn their attention with content and SEO, and convert them into customers with paid channels and email. Hands-on and metrics-driven throughout.",
  modules: [
    {
      weekNumber: 1,
      title: "Strategy & the Marketing Funnel",
      summary: "Build the strategic foundation before spending a dollar.",
      lessons: [
        {
          title: "The Marketing Funnel: Awareness to Advocacy",
          objective: "Map the stages of the funnel and the goal of each.",
          durationMinutes: 30,
          content: `## How strangers become customers

The funnel describes the journey from first contact to loyal fan:

1. **Awareness** — they discover you exist.
2. **Consideration** — they evaluate whether you can help.
3. **Conversion** — they buy.
4. **Retention** — they stay and buy again.
5. **Advocacy** — they tell others.

### Why it matters

Different channels serve different stages. Social ads create *awareness*; email nurtures *consideration*; a checkout flow drives *conversion*. Sending the wrong message to the wrong stage wastes money.

### Quick recap

Always ask: which stage of the funnel is this activity meant to move, and how will I know it worked?`,
        },
        {
          title: "Audience & Positioning",
          objective: "Define a target audience and a positioning statement.",
          durationMinutes: 35,
          content: `## You can't market to everyone

### Personas

A persona is a semi-fictional profile of your ideal customer: their goals, frustrations, and where they spend time online. It keeps your messaging focused and human.

### Positioning

Positioning is the space you occupy in the customer's mind. A classic template:

> For **[target customer]** who **[need]**, our product is a **[category]** that **[key benefit]**, unlike **[alternative]**.

### Quick recap

Sharp positioning makes every later decision — channel, message, design — easier and more consistent.`,
        },
      ],
      assessment: {
        type: "test",
        title: "Quiz: Strategy & Funnel",
        description: "Check your understanding of the funnel and positioning.",
        questions: [
          {
            question: "A customer comparing your product against two competitors is in which funnel stage?",
            options: ["Awareness", "Consideration", "Conversion", "Advocacy"],
            answerIndex: 1,
            explanation: "Evaluating options is the consideration stage — they know you exist and are weighing whether to buy.",
          },
          {
            question: "A persona is best described as:",
            options: [
              "A real, named customer",
              "A semi-fictional profile of your ideal customer",
              "A list of product features",
              "A competitor analysis",
            ],
            answerIndex: 1,
            explanation: "Personas are research-based, semi-fictional profiles that keep messaging focused on a specific audience.",
          },
          {
            question: "Which channel is typically best suited to the awareness stage?",
            options: ["Abandoned-cart emails", "Broad social media ads", "A pricing page", "A loyalty program"],
            answerIndex: 1,
            explanation: "Broad social ads reach new audiences who don't yet know you, which is the goal of awareness.",
          },
        ],
      },
    },
    {
      weekNumber: 2,
      title: "Content, SEO & Organic Reach",
      summary: "Earn attention without paying for every click.",
      lessons: [
        {
          title: "SEO Fundamentals",
          objective: "Explain how search engines rank pages and what you can influence.",
          durationMinutes: 35,
          content: `## Getting found on Google

**Search Engine Optimization (SEO)** is the practice of earning free, organic traffic from search engines. Three pillars:

- **On-page** — relevant content, clear titles, headings, and keywords that match search intent.
- **Technical** — fast load times, mobile-friendliness, and a crawlable site structure.
- **Off-page** — backlinks from other reputable sites, which act as votes of trust.

### Search intent

Match your content to *why* someone searches. "Best running shoes" wants a comparison; "buy Nike Pegasus 41" wants a product page. Mismatched intent won't rank.

### Quick recap

Write genuinely useful content for a clear search intent, make it technically sound, and earn links over time.`,
        },
        {
          title: "Content Marketing That Converts",
          objective: "Plan content mapped to funnel stages.",
          durationMinutes: 30,
          content: `## Content with a job

Random blog posts don't grow a business. Map content to the funnel:

- **Awareness** — educational posts, how-to guides, short social videos.
- **Consideration** — comparisons, case studies, webinars.
- **Conversion** — product pages, testimonials, free trials.

### The 80/20 rule

Roughly 80% of your content should help or entertain; only ~20% should directly sell. Earn the right to pitch by being useful first.

### Repurpose relentlessly

One webinar becomes a blog post, five social clips, and an email. Create once, distribute everywhere.

### Quick recap

Every piece of content should have a funnel stage and a next step in mind.`,
        },
      ],
      assessment: {
        type: "test",
        title: "Quiz: Content & SEO",
        description: "Test your knowledge of SEO and content strategy.",
        questions: [
          {
            question: "Backlinks from reputable websites are part of which SEO pillar?",
            options: ["On-page SEO", "Technical SEO", "Off-page SEO", "Paid SEO"],
            answerIndex: 2,
            explanation: "Off-page SEO covers signals from outside your site, especially backlinks acting as votes of trust.",
          },
          {
            question: "Someone searching 'buy Nike Pegasus 41' has what search intent?",
            options: ["Informational", "Navigational", "Transactional", "Accidental"],
            answerIndex: 2,
            explanation: "A specific product query with 'buy' signals transactional intent — they're ready to purchase.",
          },
          {
            question: "According to the 80/20 guideline for content, you should:",
            options: [
              "Sell in 80% of content",
              "Help or entertain in roughly 80% of content",
              "Only ever publish sales pages",
              "Avoid publishing more than once a month",
            ],
            answerIndex: 1,
            explanation: "Most content should provide value; only a smaller share should be overtly promotional.",
          },
        ],
      },
    },
    {
      weekNumber: 3,
      title: "Paid Channels, Email & Measurement",
      summary: "Spend efficiently and prove your results.",
      lessons: [
        {
          title: "Paid Ads & Email Basics",
          objective: "Compare paid acquisition with email retention and key metrics.",
          durationMinutes: 35,
          content: `## Paying for reach, keeping it with email

### Paid advertising

Platforms like Google and Meta let you buy targeted attention. Key terms:

- **CPC** — cost per click.
- **CTR** — click-through rate (clicks ÷ impressions).
- **CPA** — cost per acquisition (what you pay per customer).
- **ROAS** — return on ad spend (revenue ÷ ad cost).

Start small, test creatives, and scale only what's profitable.

### Email marketing

Email remains the highest-ROI channel because you *own* the audience. Use it for nurturing and retention: welcome sequences, newsletters, and win-back campaigns. Always grow your list with permission.

### Quick recap

Paid ads buy reach you rent; email builds an audience you own. Use both.`,
        },
        {
          title: "Analytics & A/B Testing",
          objective: "Use experiments and metrics to improve performance.",
          durationMinutes: 30,
          content: `## Let the data decide

### A/B testing

Show version A to half your audience and version B to the other half, then measure which performs better. Change **one variable at a time** (a headline, a button color) so you know what caused the difference.

### Conversion rate

$$Conversion\\ Rate = \\frac{Conversions}{Total\\ Visitors} \\times 100$$

Small improvements compound: lifting a landing page from 2% to 3% is a 50% increase in customers from the same traffic.

### Don't fool yourself

Wait for enough data before declaring a winner. Tiny samples produce random noise that looks like insight.

### Quick recap

Test one thing at a time, measure conversion, and be patient with the data.`,
        },
      ],
      assessment: {
        type: "project",
        title: "Project: Build a Campaign Plan",
        description: "Tie everything together into a complete, metrics-driven campaign.",
        brief: {
          brief: `## Scenario

A local coffee roaster wants to launch a new subscription service and has a **$500/month** marketing budget. They have a website, an Instagram account, and an email list of 300 past customers.

## Your task

Write a one-page campaign plan to acquire the first 50 subscribers, using the strategy, content, paid, and email concepts from this course.`,
          requirements: [
            "Define the target audience and a positioning statement",
            "Map at least one activity to each funnel stage (awareness → retention)",
            "Allocate the $500 budget across channels with a rationale",
            "Name the key metrics you'll track (e.g., CPA, conversion rate, ROAS)",
            "Include one A/B test you would run and what you'd learn from it",
          ],
          rubric: [
            "Plan covers the full funnel, not just awareness",
            "Budget allocation is realistic and justified",
            "Success metrics are specific and tied to the goal",
            "Demonstrates an experiment-driven mindset",
          ],
        },
      },
    },
  ],
}

export const DEMO_COURSES: DemoCourse[] = [cybersecurity, productManagement, digitalMarketing]

export function getDemoCourse(key: string): DemoCourse | undefined {
  return DEMO_COURSES.find((c) => c.key === key)
}
