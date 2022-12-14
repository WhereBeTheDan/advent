defmodule Advent2022 do
  def day1 do
    stream = File.stream!("/Users/dkoch/projects/advent/advent2022/data/day1.txt")
    data = Enum.reduce(stream, "", fn x, d -> d <> x end)

    elves = String.split(data, "\n\n")

    sum_elf = fn e ->
      foods = String.split(e, "\n")
      Enum.reduce(foods, 0, fn x, acc -> String.to_integer(x) + acc end)
    end

    totals = Enum.map(elves, sum_elf)
    totals_sorted = Enum.sort(totals)
    maxes = Enum.take(totals_sorted, -3)

    answer = %{"partA" => List.last(maxes), "partB" => Enum.sum(maxes)}

    print_answer(1, answer)
  end

  defp print_answer(day, answer) do
    IO.puts("Day #{day} ==========")
    Enum.map(answer, fn {k, v} -> IO.write("  "); IO.inspect v, label: k end)
  end
end

Advent2022.day1()
