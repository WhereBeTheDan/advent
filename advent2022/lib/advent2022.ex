defmodule Advent2022 do
  def day1 do
    elves = read_file("day1.txt", "\n\n")

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

  def day2 do
    rounds = read_file("day2.txt", "\n")

    mapA = %{"A" => 1, "B" => 2, "C" => 3, "X" => 1, "Y" => 2, "Z" => 3}
    mapB = %{"X" => 0, "Y" => 3, "Z" => 6}

    totalA = Enum.reduce(rounds, 0, fn r, acc ->
      plays = String.split(r, " ")
      opp = Map.get(mapA, List.first(plays))
      me = Map.get(mapA, List.last(plays))
      game = cond do
        opp == me -> 3
        me == opp + 1 or me == 1 and opp == 3 -> 6
        true -> 0
      end
      acc + me + game
    end)

    totalB = Enum.reduce(rounds, 0, fn r, acc ->
      plays = String.split(r, " ")
      opp = Map.get(mapA, List.first(plays))
      game = Map.get(mapB, List.last(plays))
      me = cond do
        game == 0 -> if opp == 1, do: 3, else: opp - 1
        game == 3 -> opp
        game == 6 -> if opp == 3, do: 1, else: opp + 1
      end
      acc + me + game
    end)

    answer = %{"partA" => totalA, "partB" => totalB}

    print_answer(2, answer)
  end

  defp read_file(path) do
    stream = File.stream!("/Users/dkoch/projects/advent/advent2022/data/" <> path)
    Enum.reduce(stream, "", fn x, d -> d <> x end)
  end

  defp read_file(path, delimiter) do
    dstring = read_file(path)
    String.split(dstring, delimiter)
  end

  defp print_answer(day, answer) do
    IO.puts("Day #{day} ==========")
    Enum.map(answer, fn {k, v} -> IO.write("  "); IO.inspect v, label: k end)
  end
end

Advent2022.day1()
Advent2022.day2()
