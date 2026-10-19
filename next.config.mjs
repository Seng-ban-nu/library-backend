const nextConfig = {
  reactCompiler: true,
  async rewrites() { return [
    {source:'/api/books',destination:'/api/book'},
    {source:'/api/books/:id',destination:'/api/book/:id'}
  ]; }
};
export default nextConfig;
