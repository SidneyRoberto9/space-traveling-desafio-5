import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AiOutlineCalendar, AiOutlineClockCircle } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  const { title, banner, author, content } = post.data;

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const readingTime = content.reduce((acc, content) => {
    const text = content.heading + content.body.map(body => body.text).join('');
    const words = text.split(/\s/g).length;
    const time = Math.ceil(words / 200);

    return acc + time;
  }, 0);

  return (
    <>
      <Head>
        <title>{title} | SpaceTraveling</title>
      </Head>

      <img src={banner.url} alt="banner" className={styles.banner} />

      <main className={styles.container}>
        <strong>{title}</strong>
        <section>
          <span>
            <AiOutlineCalendar size={20} />
            <small>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </small>
          </span>
          <span>
            <FiUser size={20} />
            <small>{author}</small>
          </span>
          <span>
            <AiOutlineClockCircle size={20} />
            <small>{readingTime + ' '} min</small>
          </span>
        </section>

        {content.map(content => (
          <article key={content.heading}>
            <h2>{content.heading}</h2>

            {content.body.map(body => (
              <p key={body.text}>{body.text}</p>
            ))}
          </article>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts', {
    pageSize: 5,
  });

  return {
    paths: posts.results.map(post => {
      return {
        params: {
          slug: post.uid,
        },
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => ({
        body: content.body.map(body => ({
          type: body.type,
          text: body.text,
          spans: body.spans,
        })),
        heading: content.heading,
      })),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
