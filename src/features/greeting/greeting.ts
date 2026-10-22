export function greetingResponse(input: string | null): Response {
  const name = input?.trim() || 'contributor';
  if (name.length > 80) {
    return Response.json(
      { error: 'Name must be 80 characters or fewer' },
      { status: 400 },
    );
  }
  return Response.json({ message: `Hello, ${name}!` });
}
