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

  def day3 do
    sacks = read_file("day3.txt", "\n")

    calc_pri = fn x ->
      cond do
        x >= ?A and x <= ?Z -> x - ?A + 27
        x >= ?a and x <= ?z -> x - ?a + 1
        true -> 0
      end
    end

    totalA = Enum.reduce(sacks, 0, fn s, acc ->
      size = div(String.length(s), 2)
      comp1 = String.to_charlist(s) |> Enum.take(size) |> MapSet.new
      comp2 = String.to_charlist(s) |> Enum.take(-size) |> MapSet.new
      pri = MapSet.intersection(comp1, comp2) |> Enum.take(1) |> List.first() |> Kernel.then(calc_pri)
      acc + pri
    end)

    totalB = Enum.chunk_every(sacks, 3) |> Enum.reduce(0, fn g, acc ->
      pri = Enum.map(g, fn m -> String.to_charlist(m) |> MapSet.new end)
        |> Kernel.then(fn g ->
          [head | tail] = g
          Enum.reduce(tail, head, fn m, a -> MapSet.intersection(m, a) end)
        end)
        |> Enum.take(1)
        |> List.first()
        |> Kernel.then(calc_pri)
      acc + pri
    end)

    answer = %{"partA" => totalA, "partB" => totalB}

    print_answer(3, answer)
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
Advent2022.day3()
