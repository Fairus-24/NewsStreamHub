import { db } from "./db";
import { users, categories, articles, tags, articleTags } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateSlug } from "./utils";

// Categories to seed
const categoryData = [
  { name: "Politics", description: "Latest political news and updates" },
  { name: "Business", description: "Business and economic news" },
  { name: "Technology", description: "Latest tech updates and innovations" },
  { name: "Health", description: "Health and wellness articles" },
  { name: "Entertainment", description: "Entertainment and celebrity news" },
  { name: "Sports", description: "Sports news and match updates" },
  { name: "Science", description: "Scientific discoveries and research" },
  { name: "Environment", description: "Climate and environmental news" },
];

// Tags to seed
const tagData = [
  "World", "Local", "Finance", "AI", "Election", "Climate", 
  "Health", "COVID-19", "Innovation", "Space", "Markets",
  "Education", "Policy", "Economy", "Hollywood"
];

// Sample articles
const sampleArticles = [
  {
    title: "Global Economy Faces Unprecedented Challenges Amid Shifting Geopolitical Landscape",
    excerpt: "World economic leaders gather to address growing concerns about inflation, supply chain issues, and trade tensions.",
    content: `<p>In a high-stakes summit that concluded yesterday, finance ministers from G20 nations acknowledged the complex challenges facing the global economy. The meeting, which took place against a backdrop of rising inflation and persistent supply chain disruptions, highlighted the need for coordinated action.</p>
    
    <p>"We're navigating uncharted waters," said IMF Managing Director Kristalina Georgieva. "The combination of pandemic recovery, climate change adaptation, and geopolitical tensions has created a perfect storm for global markets."</p>
    
    <p>Key points of discussion included:</p>
    <ul>
      <li>Strategies to combat inflation without triggering recession</li>
      <li>Reinforcing supply chain resilience</li>
      <li>Managing sovereign debt among developing nations</li>
      <li>Addressing currency volatility</li>
    </ul>
    
    <p>The summit concluded with a joint statement emphasizing commitment to maintaining open trade channels and providing support to vulnerable economies. However, analysts noted that concrete action plans remained vague, reflecting the difficult balancing act facing policymakers.</p>
    
    <p>"The real challenge now is implementation," noted economist Carmen Reinhart. "Countries are naturally focused on domestic concerns, but the solutions must be global in nature."</p>
    
    <p>Markets responded cautiously to the summit's conclusion, with modest gains across major indices as investors processed the implications of the discussions.</p>`,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", // economy/finance
    categoryName: "Business",
    isBreaking: true,
  },
  {
    title: "Breakthrough in Quantum Computing Promises to Revolutionize Data Processing",
    excerpt: "Scientists achieve stable quantum entanglement at room temperature, potentially making quantum computers more practical for everyday use.",
    content: `<p>A team of researchers at the Massachusetts Institute of Technology (MIT) has announced a significant breakthrough in quantum computing technology that could accelerate the development of practical quantum computers.</p>
    
    <p>The research, published yesterday in the journal Nature Physics, demonstrates a method for maintaining quantum coherence—the delicate state necessary for quantum calculations—at room temperature for over 10 milliseconds. While that might seem brief, it represents a thousand-fold improvement over previous efforts and crosses a critical threshold for practical applications.</p>
    
    <p>"This is the quantum equivalent of breaking the sound barrier," said Dr. Michelle Chen, the study's lead author. "We've long known that quantum computing could theoretically provide exponential speedups for certain types of problems, but environmental interference has been a major roadblock."</p>
    
    <p>Traditional quantum systems require extreme cooling to near absolute zero temperatures (-273.15°C), making them expensive and impractical for widespread deployment. This new approach uses a novel material combining hexagonal boron nitride with diamond nitrogen-vacancy centers to create more robust qubits—the fundamental units of quantum information.</p>
    
    <p>Industry experts suggest the implications could be profound. "If these results can be replicated and scaled, we might see quantum advantage for practical problems much sooner than anticipated," noted quantum computing specialist Dr. Robert Malik, who was not involved in the research.</p>
    
    <p>Potential applications include:</p>
    <ul>
      <li>Accelerated drug discovery through improved molecular modeling</li>
      <li>More efficient optimization for logistics and transportation</li>
      <li>Enhanced machine learning capabilities</li>
      <li>Better climate modeling</li>
    </ul>
    
    <p>Tech giants including IBM, Google, and Microsoft have already expressed interest in incorporating the technique into their quantum research programs.</p>`,
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80", // quantum/technology
    categoryName: "Technology",
    isBreaking: false,
  },
  {
    title: "Climate Summit Yields Historic Agreement on Carbon Emissions Reduction",
    excerpt: "After marathon negotiations, 196 countries commit to accelerated timeline for cutting greenhouse gas emissions.",
    content: `<p>In what environmental advocates are calling a watershed moment for climate action, the United Nations Climate Change Conference (COP29) concluded today with a landmark agreement to significantly accelerate carbon emissions reduction timelines.</p>
    
    <p>The accord, dubbed the "Geneva Protocol," commits 196 countries to reducing carbon emissions by 60% from 2010 levels by 2035—a substantially more ambitious target than previous international agreements.</p>
    
    <p>"This represents a fundamental shift in global climate diplomacy," said UN Secretary-General António Guterres. "For the first time, we have an agreement that truly reflects the urgency of the climate crisis."</p>
    
    <p>Key provisions of the agreement include:</p>
    <ul>
      <li>Binding emissions reduction targets for all signatories, including developing nations</li>
      <li>A $300 billion climate finance mechanism to support green transitions in low-income countries</li>
      <li>Mandatory climate risk disclosure for major corporations</li>
      <li>Accelerated phaseout of coal power generation</li>
      <li>Enhanced monitoring and verification protocols</li>
    </ul>
    
    <p>The breakthrough came after three days of round-the-clock negotiations, during which several major economies significantly strengthened their commitments. China, the world's largest carbon emitter, agreed to peak its emissions by 2025—five years earlier than its previous target.</p>
    
    <p>Climate scientists have cautiously welcomed the agreement. "If fully implemented, these measures would give us a fighting chance of limiting warming to 1.8°C above pre-industrial levels," said Dr. Katherine Johnson of the Climate Action Tracker. "That's still above the Paris Agreement's 1.5°C aspiration, but a major improvement over the 2.7°C trajectory we were on."</p>
    
    <p>Implementation remains the critical challenge, with countries required to submit detailed action plans within 18 months.</p>`,
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80", // climate/environment
    categoryName: "Environment",
    isBreaking: false,
  },
  {
    title: "Political Turmoil as Parliament Faces No-Confidence Vote",
    excerpt: "The government faces a crucial no-confidence vote amid allegations of corruption and public unrest.",
    content: `<p>The political landscape has been shaken as the ruling party faces a no-confidence vote in parliament. Allegations of corruption and growing public protests have put immense pressure on lawmakers to act decisively.</p>\n\n<p>Opposition leaders have called for transparency and accountability, while international observers are closely monitoring the situation.</p>`,
    image: "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=1200&q=80", // politics
    categoryName: "Politics",
    isBreaking: true,
  },
  {
    title: "Breakthrough Cancer Therapy Shows Promising Results in Early Trials",
    excerpt: "A new immunotherapy treatment has shown remarkable effectiveness in shrinking tumors during phase 1 clinical trials.",
    content: `<p>Researchers have announced a breakthrough in cancer treatment, with a new immunotherapy drug demonstrating significant tumor reduction in early-stage clinical trials. The therapy, which harnesses the body's own immune system, could represent a major advance in oncology.</p>`,
    image: "https://images.unsplash.com/photo-1511174511562-5f97f4f4b3c4?auto=format&fit=crop&w=1200&q=80", // health/medicine
    categoryName: "Health",
    isBreaking: false,
  },
  {
    title: "Championship Final: Underdogs Clinch Victory in Stunning Upset",
    excerpt: "In a dramatic turn of events, the underdog team secured a last-minute win in the national championship final.",
    content: `<p>Sports fans were left in awe as the underdog team pulled off a stunning upset in the national championship final. The match, filled with suspense and last-minute heroics, will be remembered for years to come.</p>`,
    image: "https://images.unsplash.com/photo-1505843273132-bc5c6f7bfa98?auto=format&fit=crop&w=1200&q=80", // sports
    categoryName: "Sports",
    isBreaking: false,
  },
  {
    title: "Hollywood Blockbuster Breaks Box Office Records Worldwide",
    excerpt: "The latest Hollywood blockbuster has shattered box office records, grossing over $1 billion globally in its opening weekend.",
    content: `<p>The entertainment industry is abuzz as the latest Hollywood blockbuster has broken box office records worldwide. The film's success is attributed to its star-studded cast, cutting-edge visual effects, and a compelling storyline.</p>`,
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80", // entertainment/hollywood
    categoryName: "Entertainment",
    isBreaking: false,
  },
  {
    title: "Mars Rover Discovers Evidence of Ancient Water Flows",
    excerpt: "NASA's Mars rover has found new evidence suggesting that liquid water once flowed on the surface of the Red Planet.",
    content: `<p>NASA scientists have revealed that the Mars rover has discovered geological formations indicating the past presence of liquid water on Mars. This finding could have significant implications for the search for extraterrestrial life.</p>`,
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80", // science/space
    categoryName: "Science",
    isBreaking: false,
  }
];

const unsplashRandomImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511174511562-5f97f4f4b3c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505843273132-bc5c6f7bfa98?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1465101178521-1e1ec7a1b8a0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80"
];

// Pastikan setiap artikel memiliki image, jika tidak tambahkan random
for (const article of sampleArticles) {
  if (!article.image || article.image.trim() === "") {
    const randomIdx = Math.floor(Math.random() * unsplashRandomImages.length);
    article.image = unsplashRandomImages[randomIdx];
  }
}

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create admin user
    console.log("Creating admin user...");
    await db.insert(users).values({
      id: "admin",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      role: "admin",
      profileImageUrl: "https://ui-avatars.com/api/?name=Admin+User&background=1A237E&color=fff",
    }).onConflictDoNothing();
    
    // 2. Create categories
    console.log("Creating categories...");
    for (const category of categoryData) {
      await db.insert(categories).values({
        name: category.name,
        slug: generateSlug(category.name),
        description: category.description,
      }).onConflictDoNothing();
    }
    
    // 3. Create tags
    console.log("Creating tags...");
    for (const tagName of tagData) {
      await db.insert(tags).values({
        name: tagName,
        slug: generateSlug(tagName),
      }).onConflictDoNothing();
    }
    
    // 4. Get admin user, categories, and tags for article creation
    const adminUser = await db.select().from(users).where(eq(users.id, "admin")).limit(1);
    const createdCategories = await db.select().from(categories);
    const createdTags = await db.select().from(tags);
    
    if (adminUser.length > 0 && createdCategories.length > 0) {
      // 5. Create articles
      console.log("Creating articles...");
      
      for (const articleData of sampleArticles) {
        const category = createdCategories.find(c => c.name === articleData.categoryName);
        
        if (category) {
          // Ensure all values are strings/numbers/null
          const insertData = {
            title: String(articleData.title),
            slug: generateSlug(articleData.title),
            excerpt: String(articleData.excerpt),
            content: String(articleData.content),
            image: String(articleData.image),
            categoryId: category.id,
            authorId: adminUser[0].id,
            status: "published",
            isBreaking: articleData.isBreaking ? 1 : 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          let article;
          try {
            [article] = await db.insert(articles).values(insertData).onConflictDoNothing().returning();
          } catch (err) {
            console.error('Error inserting article:', insertData, err);
            continue;
          }
          if (article) {
            // 6. Create article tags (3-5 random tags per article)
            const randomTags = createdTags
              .sort(() => 0.5 - Math.random())
              .slice(0, Math.floor(Math.random() * 3) + 3);
            for (const tag of randomTags) {
              try {
                await db.insert(articleTags).values({
                  articleId: article.id,
                  tagId: tag.id,
                }).onConflictDoNothing();
              } catch (err) {
                console.error('Error inserting articleTag:', { articleId: article.id, tagId: tag.id }, err);
              }
            }
          }
        }
      }
    }
    
    console.log("✅ Database seeding completed successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

// Run the seed function
seedDatabase();