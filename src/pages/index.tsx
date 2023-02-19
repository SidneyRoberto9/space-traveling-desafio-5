import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { AiOutlineCalendar } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [content, setContent] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  async function handleGetMorePosts() {
    const response = await fetch(nextPage);
    const data = await response.json();

    const newPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setNextPage(data.next_page);
    setContent(state => [...state, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>

      <main className={styles.container}>
        {content.map(({ data, uid, first_publication_date }) => (
          <article className={styles.post} key={uid}>
            <Link href={`/post/${uid}`}>{data.title}</Link>
            <p>{data.subtitle}</p>
            <section>
              <span>
                <AiOutlineCalendar size={20} />
                <p>
                  {format(new Date(first_publication_date), 'dd MMM yyyy', {
                    locale: ptBR,
                  })}
                </p>
              </span>
              <span>
                <FiUser size={20} />
                <p>{data.author}</p>
              </span>
            </section>
          </article>
        ))}

        {nextPage && (
          <button
            type="button"
            className={styles.moreButton}
            onClick={handleGetMorePosts}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});

  const postsResponse = await prismic.getByType('posts', {
    pageSize: 20,
  });

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
