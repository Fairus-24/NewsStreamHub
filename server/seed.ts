import { categories, articles, tags, articleTags, users } from "@shared/schema";
import { db } from "./db";
import { generateSlug } from "./utils";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create admin user if not exists
    const adminExists = await db.select().from(users).where(eq(users.id, "admin"));
    
    if (adminExists.length === 0) {
      console.log("Creating admin user...");
      await db.insert(users).values({
        id: "admin",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        role: "admin",
        profileImageUrl: "https://ui-avatars.com/api/?name=Admin+User&background=1A237E&color=fff",
      });
    }

    // Add categories if none exist
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length === 0) {
      console.log("Creating categories...");
      
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
      
      for (const category of categoryData) {
        await db.insert(categories).values({
          name: category.name,
          slug: generateSlug(category.name),
          description: category.description,
        });
      }
    }

    // Add tags if none exist
    const existingTags = await db.select().from(tags);
    
    if (existingTags.length === 0) {
      console.log("Creating tags...");
      
      const tagData = [
        "World", "Local", "Finance", "AI", "Election", "Climate", 
        "Health", "COVID-19", "Innovation", "Space", "Markets",
        "Education", "Policy", "Economy", "Hollywood"
      ];
      
      for (const tag of tagData) {
        await db.insert(tags).values({
          name: tag,
          slug: generateSlug(tag),
        });
      }
    }

    // Add sample articles if none exist
    const existingArticles = await db.select().from(articles);
    
    if (existingArticles.length === 0) {
      console.log("Creating sample articles...");
      
      // Get admin user
      const [admin] = await db.select().from(users).where(eq(users.id, "admin"));
      
      // Get categories
      const allCategories = await db.select().from(categories);
      
      // Get tags
      const allTags = await db.select().from(tags);
      
      if (admin && allCategories.length > 0) {
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
            image: "https://source.unsplash.com/random/1200x800/?economy,business",
            categoryId: allCategories.find(c => c.slug === "business")?.id || allCategories[0].id,
            authorId: admin.id,
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
            image: "https://source.unsplash.com/random/1200x800/?quantum,technology",
            categoryId: allCategories.find(c => c.slug === "technology")?.id || allCategories[0].id,
            authorId: admin.id,
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
            image: "https://source.unsplash.com/random/1200x800/?climate,environment",
            categoryId: allCategories.find(c => c.slug === "environment")?.id || allCategories[0].id,
            authorId: admin.id,
            isBreaking: false,
          }
        ];
        
        for (const articleData of sampleArticles) {
          const [article] = await db.insert(articles).values({
            ...articleData,
            slug: generateSlug(articleData.title),
            status: "published",
          }).returning();
          
          // Add tags to articles
          const randomTags = allTags
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 5) + 2);
          
          for (const tag of randomTags) {
            await db.insert(articleTags).values({
              articleId: article.id,
              tagId: tag.id,
            });
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
seed();