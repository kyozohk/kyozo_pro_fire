import React, { useState, useEffect, useRef } from 'react';
import { Query, DocumentData, getDocs } from 'firebase/firestore';

// Resource cache to prevent duplicate fetching
const cache = new Map<string, any>();

// Create a resource that can be read by Suspense
function createResource<T>(promise: Promise<T>, key: string) {
  console.log('📝 Creating resource with key:', key);
  let status = 'pending';
  let result: T;
  let error: Error;

  // Add a timeout to prevent hanging indefinitely
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Query timeout after 10 seconds for key: ${key}`));
    }, 10000); // 10 second timeout
  });

  // Create a properly shaped suspender
  const suspender = Promise.race([promise, timeoutPromise]);
  
  // Handle the promise resolution
  suspender.then(
    (data) => {
      console.log('✅ Promise resolved successfully for key:', key);
      status = 'success';
      result = data as T;
      // Store in cache
      cache.set(key, { status, result });
      console.log('💾 Data cached with status:', status);
      return data;
    },
    (e) => {
      console.error('❌ Promise rejected with error for key:', key, e);
      status = 'error';
      error = e;
      // Store error in cache
      cache.set(key, { status, error });
      console.log('💾 Error cached with status:', status);
      throw e;
    }
  );

  return {
    read() {
      console.log('📚 Reading resource with status:', status);
      if (status === 'pending') {
        console.log('⏳ Status is pending, throwing suspender promise...');
        throw suspender;
      } else if (status === 'error') {
        console.log('❌ Status is error, throwing error...');
        throw error;
      } else {
        console.log('✅ Status is success, returning result');
        return result;
      }
    },
  };
}

// Generate a cache key from a Firestore query
function generateQueryKey(query: Query<DocumentData> | null): string {
  if (!query) return 'null-query';
  
  // This is a simplified way to create a key
  // We use a combination of the path and any constraints as a unique identifier
  const path = (query as any)._path?.toString() || '';
  const queryConstraints = (query as any)._queryConstraints?.map((c: any) => c.toString()).join('-') || '';
  
  return `query-${path}-${queryConstraints}`;
}

/**
 * Hook that fetches Firestore data with Suspense support
 * @param query Firestore query
 * @param deps Dependencies array to trigger refetch
 * @returns The fetched data
 */
// Create a static resource for initial render to avoid re-creating on each render
let initialResource: any = null;

export function useSuspenseQuery<T = DocumentData>(query: Query<DocumentData> | null, deps: any[] = []) {
  // Use a ref to track if this is the first render
  const isFirstRender = React.useRef(true);
  const [resource, setResource] = useState<any>(() => {
    // On first mount, create an initial resource if needed
    if (!initialResource && query) {
      console.log('🔄 Creating initial resource on first render');
      const queryKey = generateQueryKey(query);
      
      // Check cache first
      if (cache.has(queryKey)) {
        const cachedResource = cache.get(queryKey);
        if (cachedResource.status === 'success') {
          console.log('✅ Using cached data on first render');
          return { read: () => cachedResource.result };
        }
      }
      
      // Create new resource
      const fetchData = async () => {
        console.log('🔄 Initial data fetch from Firestore');
        try {
          const snapshot = await getDocs(query);
          console.log('✅ Initial data fetched, docs:', snapshot.docs.length);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        } catch (error) {
          console.error('❌ Initial fetch error:', error);
          throw error;
        }
      };
      
      initialResource = createResource(fetchData(), queryKey);
      return initialResource;
    }
    return null;
  });
  
  useEffect(() => {
    // Skip effect on first render since we already created the resource
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    console.log('🔍 useSuspenseQuery - Effect running with query:', query ? 'Query exists' : 'No query');
    if (!query) return;
    
    const queryKey = generateQueryKey(query);
    console.log('🔑 Generated query key:', queryKey);
    
    // Check if we have this query in cache
    if (cache.has(queryKey)) {
      console.log('✅ Cache hit for key:', queryKey);
      const cachedResource = cache.get(queryKey);
      if (cachedResource.status === 'success') {
        console.log('📦 Using cached result with status:', cachedResource.status);
        setResource({ read: () => cachedResource.result });
        return;
      }
      console.log('⚠️ Cache entry exists but status is not success:', cachedResource.status);
    } else {
      console.log('❌ Cache miss for key:', queryKey);
    }
    
    // Create a new resource
    const fetchData = async () => {
      console.log('🔄 Fetching data from Firestore...');
      try {
        const snapshot = await getDocs(query);
        console.log('✅ Data fetched successfully, docs count:', snapshot.docs.length);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        throw error;
      }
    };
    
    console.log('🔄 Creating resource for query...');
    setResource(createResource(fetchData(), queryKey));
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ...deps]);
  
  if (!resource) {
    console.log('⏳ No resource yet, throwing promise to suspend...');
    // Create a proper suspender promise that React can handle
    const suspenderPromise = new Promise((resolve) => setTimeout(resolve, 100));
    // Create a thenable object instead of modifying the Promise
    const thenable = {
      then(resolve: any) {
        return suspenderPromise.then(resolve);
      }
    };
    throw thenable;
  }
  
  console.log('🎯 Resource ready, reading data...');
  return resource.read();
}

/**
 * Clear the cache for testing or when needed
 */
export function clearQueryCache() {
  cache.clear();
}
