import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { getSite } from '../utils/consts';

export async function GET(context) {
    // 1. Point to 'writings' instead of 'blog'
    const posts = await getCollection('writings');
    const site = await getSite();
    
    // 2. Convert the Role array into a String for RSS compliance
    const description = Array.isArray(site.author.role) 
        ? site.author.role.join(', ') 
        : site.author.description;

    return rss({
        title: site.author.name,
        description: description,
        site: context.site,
        items: posts.map((post) => ({
            title: post.data.title,
            pubDate: post.data.pubDate,
            description: post.data.description,
            // 3. Ensure links match your new /writings/ path
            link: `/writings/${post.id}/`,
        })),
    });
}